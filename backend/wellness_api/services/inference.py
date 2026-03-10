import json
import numpy as np
import joblib
from pathlib import Path

from wellness_api.core import config

# ----------------------------
# Globals
# ----------------------------
lstm_model = None
lstm_scaler = None
lstm_label_map = None
lstm_meta = None

anfis_model = None
anfis_scaler = None
anfis_label_map = None
anfis_meta = None
anfis_device = None

stress_xgb_model = None
stress_xgb_label_map = None
stress_xgb_meta = None


def _p(pth) -> Path | None:
    if not pth:
        return None
    try:
        return Path(str(pth))
    except Exception:
        return None


def _file_exists(pth) -> bool:
    pp = _p(pth)
    return pp is not None and pp.exists()


# ----------------------------
# ANFIS model class (same as training)
# ----------------------------
def _build_anfis_model(n_inputs=4, n_mfs=2):
    import torch
    import torch.nn as nn
    import itertools

    class ANFIS(nn.Module):
        def __init__(self, n_inputs=4, n_mfs=2):
            super().__init__()
            self.n_inputs = n_inputs
            self.n_mfs = n_mfs

            combos = list(itertools.product(range(n_mfs), repeat=n_inputs))
            self.n_rules = len(combos)
            self.register_buffer("rule_indices", torch.tensor(combos, dtype=torch.long))

            self.mf_centers = nn.Parameter(torch.zeros(n_inputs, n_mfs))
            self.mf_sigmas = nn.Parameter(torch.ones(n_inputs, n_mfs))
            self.consequents = nn.Parameter(torch.zeros(self.n_rules, n_inputs + 1))

            self._init_parameters()

        def _init_parameters(self):
            with torch.no_grad():
                for i in range(self.n_inputs):
                    self.mf_centers[i, 0] = -0.5
                    self.mf_centers[i, 1] = 0.5
                self.mf_sigmas.fill_(1.0)
                nn.init.normal_(self.consequents, mean=0.0, std=0.1)

        def gaussian_mf(self, x, c, s):
            return torch.exp(-0.5 * ((x - c) / (s + 1e-6)) ** 2)

        def forward(self, x):
            batch_size = x.size(0)

            x_exp = x.unsqueeze(2)  # (batch, n_inputs, 1)
            c = self.mf_centers.unsqueeze(0)  # (1, n_inputs, n_mfs)
            s = torch.clamp(self.mf_sigmas.unsqueeze(0), min=1e-3)

            mu = self.gaussian_mf(x_exp, c, s)  # (batch, n_inputs, n_mfs)

            idx = self.rule_indices.t().unsqueeze(0).expand(batch_size, -1, -1)
            mu_selected = torch.gather(mu, 2, idx)  # (batch, n_inputs, n_rules)
            mu_selected = mu_selected.permute(0, 2, 1)  # (batch, n_rules, n_inputs)
            w = mu_selected.prod(dim=2)  # (batch, n_rules)

            w_sum = w.sum(dim=1, keepdim=True) + 1e-6
            w_norm = w / w_sum

            a = self.consequents[:, :-1]  # (n_rules, n_inputs)
            b = self.consequents[:, -1]   # (n_rules,)

            y_r = x @ a.t() + b.unsqueeze(0)  # (batch, n_rules)
            y = (w_norm * y_r).sum(dim=1, keepdim=True)  # (batch, 1)
            return y

    return ANFIS(n_inputs=n_inputs, n_mfs=n_mfs)


# ----------------------------
# Load models (LSTM + ANFIS are required; XGB optional)
# ----------------------------
def load_models():
    global lstm_model, lstm_scaler, lstm_label_map, lstm_meta
    global anfis_model, anfis_scaler, anfis_label_map, anfis_meta, anfis_device
    global stress_xgb_model, stress_xgb_label_map, stress_xgb_meta

    # ---- Load LSTM ----
    if lstm_model is None:
        from tensorflow import keras

        if not _file_exists(config.LSTM_MODEL_PATH):
            raise FileNotFoundError(f"LSTM model not found: {config.LSTM_MODEL_PATH}")
        if not _file_exists(config.LSTM_SCALER_PATH):
            raise FileNotFoundError(f"LSTM scaler not found: {config.LSTM_SCALER_PATH}")
        if not _file_exists(config.LSTM_LABEL_MAP_PATH):
            raise FileNotFoundError(f"LSTM label map not found: {config.LSTM_LABEL_MAP_PATH}")
        if not _file_exists(config.LSTM_META_PATH):
            raise FileNotFoundError(f"LSTM meta not found: {config.LSTM_META_PATH}")

        lstm_model = keras.models.load_model(config.LSTM_MODEL_PATH)
        lstm_scaler = joblib.load(config.LSTM_SCALER_PATH)
        with open(config.LSTM_LABEL_MAP_PATH, "r", encoding="utf-8") as f:
            lstm_label_map = json.load(f)
        with open(config.LSTM_META_PATH, "r", encoding="utf-8") as f:
            lstm_meta = json.load(f)

    # ---- Load ANFIS ----
    if anfis_model is None:
        import torch

        if not _file_exists(config.ANFIS_MODEL_PATH):
            raise FileNotFoundError(f"ANFIS model not found: {config.ANFIS_MODEL_PATH}")
        if not _file_exists(config.ANFIS_SCALER_PATH):
            raise FileNotFoundError(f"ANFIS scaler not found: {config.ANFIS_SCALER_PATH}")
        if not _file_exists(config.ANFIS_LABEL_MAP_PATH):
            raise FileNotFoundError(f"ANFIS label map not found: {config.ANFIS_LABEL_MAP_PATH}")
        if not _file_exists(config.ANFIS_META_PATH):
            raise FileNotFoundError(f"ANFIS meta not found: {config.ANFIS_META_PATH}")

        anfis_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        with open(config.ANFIS_META_PATH, "r", encoding="utf-8") as f:
            anfis_meta = json.load(f)

        n_inputs = int(anfis_meta.get("n_inputs", 4))
        n_mfs = int(anfis_meta.get("n_mfs", 2))

        anfis_model = _build_anfis_model(n_inputs=n_inputs, n_mfs=n_mfs).to(anfis_device)
        state = torch.load(config.ANFIS_MODEL_PATH, map_location=anfis_device)
        anfis_model.load_state_dict(state)
        anfis_model.eval()

        anfis_scaler = joblib.load(config.ANFIS_SCALER_PATH)
        with open(config.ANFIS_LABEL_MAP_PATH, "r", encoding="utf-8") as f:
            anfis_label_map = json.load(f)

    # ---- Load XGBoost (OPTIONAL) ----
    # Only if paths exist in config + files exist
    if stress_xgb_model is None:
        # config might not define these in your current config.py
        xgb_model_path = getattr(config, "STRESS_XGB_MODEL_PATH", None)
        xgb_label_path = getattr(config, "STRESS_XGB_LABEL_MAP_PATH", None)
        xgb_meta_path = getattr(config, "STRESS_XGB_META_PATH", None)

        if _file_exists(xgb_model_path) and _file_exists(xgb_label_path) and _file_exists(xgb_meta_path):
            import xgboost as xgb

            stress_xgb_model = xgb.XGBClassifier()
            stress_xgb_model.load_model(str(xgb_model_path))

            with open(xgb_label_path, "r", encoding="utf-8") as f:
                stress_xgb_label_map = json.load(f)
            with open(xgb_meta_path, "r", encoding="utf-8") as f:
                stress_xgb_meta = json.load(f)
        else:
            # keep XGB disabled
            stress_xgb_model = None
            stress_xgb_label_map = None
            stress_xgb_meta = None


# ----------------------------
# Helpers
# ----------------------------
def _feature_vector_from_req(req) -> np.ndarray:
    return np.array([[
        float(req.HR_sensor),
        float(req.Heart_Rate_Variability),
        float(req.Sleep_Hours),
        float(req.steps_sensor),
    ]], dtype=float)


def _build_lstm_sequence(x_scaled: np.ndarray) -> np.ndarray:
    seq_len = int(lstm_meta.get("sequence_len", 7)) if lstm_meta else 7
    return np.repeat(x_scaled[:, None, :], seq_len, axis=1)


def _map_code_to_label(code: int) -> str:
    # Prefer LSTM map, else ANFIS map, else XGB map
    if lstm_label_map and str(code) in lstm_label_map:
        return str(lstm_label_map[str(code)])
    if anfis_label_map and str(code) in anfis_label_map:
        return str(anfis_label_map[str(code)])
    if stress_xgb_label_map and str(code) in stress_xgb_label_map:
        return str(stress_xgb_label_map[str(code)])
    return str(code)


# ----------------------------
# Predictions
# ----------------------------
def predict_stress_lstm(req) -> tuple[int, str]:
    if lstm_model is None:
        load_models()

    x = _feature_vector_from_req(req)
    x_scaled = lstm_scaler.transform(x)
    x_seq = _build_lstm_sequence(x_scaled)

    probs = lstm_model.predict(x_seq, verbose=0)
    code = int(np.argmax(probs, axis=1)[0])
    return code, _map_code_to_label(code)


def predict_stress_anfis(req) -> tuple[int, str]:
    if anfis_model is None:
        load_models()

    import torch

    x = _feature_vector_from_req(req)
    x_scaled = anfis_scaler.transform(x).astype(np.float32)

    xt = torch.from_numpy(x_scaled).to(anfis_device)
    with torch.no_grad():
        y_cont = anfis_model(xt).cpu().numpy().reshape(-1)[0]

    code = int(np.clip(np.round(y_cont), 0, 2))
    return code, _map_code_to_label(code)


def predict_stress_xgb(req) -> tuple[int, str] | None:
    # OPTIONAL
    if stress_xgb_model is None:
        return None

    feature_order = None
    if stress_xgb_meta and "feature_cols_order" in stress_xgb_meta:
        feature_order = stress_xgb_meta["feature_cols_order"]

    base = {
        "HR_sensor": float(req.HR_sensor),
        "Heart_Rate_Variability": float(req.Heart_Rate_Variability),
        "Sleep_Hours": float(req.Sleep_Hours),
        "steps_sensor": float(req.steps_sensor),
    }

    if feature_order:
        row = [base.get(col, 0.0) for col in feature_order]
    else:
        row = [base["HR_sensor"], base["Heart_Rate_Variability"], base["Sleep_Hours"], base["steps_sensor"]]

    X = np.array([row], dtype=float)
    code = int(stress_xgb_model.predict(X)[0])
    return code, _map_code_to_label(code)


def predict_stress_ensemble(req) -> dict:
    """
    Majority vote across available models.
    XGB included only if loaded successfully.
    """
    code_lstm, label_lstm = predict_stress_lstm(req)
    code_anfis, label_anfis = predict_stress_anfis(req)

    xgb_out = predict_stress_xgb(req)  # None if disabled
    votes = [code_lstm, code_anfis]
    details = {
        "lstm": {"code": code_lstm, "label": label_lstm},
        "anfis": {"code": code_anfis, "label": label_anfis},
        "xgboost": None,
        "combineRule": None,
    }

    if xgb_out is not None:
        code_xgb, label_xgb = xgb_out
        votes.append(code_xgb)
        details["xgboost"] = {"code": code_xgb, "label": label_xgb}

    # Majority vote
    final_code = None
    for c in [0, 1, 2]:
        if votes.count(c) >= 2:
            final_code = c
            break

    if final_code is None:
        # fallback: average & round
        final_code = int(np.clip(np.round(float(np.mean(votes))), 0, 2))
        details["combineRule"] = "mean_round_fallback"
    else:
        details["combineRule"] = "majority_vote"

    final_label = _map_code_to_label(final_code)

    return {
        "finalStressCode": final_code,
        "finalStressLabel": final_label,
        **details
    }
