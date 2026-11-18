import numpy as np
import pandas as pd
from sklearn.metrics import precision_score, recall_score, f1_score, accuracy_score, confusion_matrix, roc_curve, precision_recall_curve

def evaluate_detection_pipeline(y_true, y_pred_scores, threshold=25):
    """
    Evaluates ML detection pipeline performance against ground truth flags.
    y_true: list of booleans/ints (1 if ground truth has inconsistency, 0 if clean)
    y_pred_scores: list of predicted 0-100 inconsistency scores
    """
    y_true = np.array(y_true, dtype=int)
    y_pred_scores = np.array(y_pred_scores, dtype=float)
    y_pred_binary = (y_pred_scores >= threshold).astype(int)

    # Basic metrics
    acc = float(accuracy_score(y_true, y_pred_binary))
    prec = float(precision_score(y_true, y_pred_binary, zero_division=0))
    rec = float(recall_score(y_true, y_pred_binary, zero_division=0))
    f1 = float(f1_score(y_true, y_pred_binary, zero_division=0))

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred_binary, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)

    # ROC curve coordinates for frontend chart
    if len(np.unique(y_true)) > 1:
        fpr, tpr, roc_thresholds = roc_curve(y_true, y_pred_scores / 100.0)
        roc_data = [{"fpr": round(float(f), 4), "tpr": round(float(t), 4)} for f, t in zip(fpr, tpr)]

        p_vals, r_vals, pr_thresholds = precision_recall_curve(y_true, y_pred_scores / 100.0)
        pr_data = [{"precision": round(float(p), 4), "recall": round(float(r), 4)} for p, r in zip(p_vals, r_vals)]
    else:
        roc_data = [{"fpr": 0.0, "tpr": 0.0}, {"fpr": 1.0, "tpr": 1.0}]
        pr_data = [{"precision": 1.0, "recall": 1.0}]

    return {
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "threshold_used": threshold
        },
        "confusion_matrix": {
            "tp": int(tp),
            "fp": int(fp),
            "tn": int(tn),
            "fn": int(fn)
        },
        "roc_curve": roc_data[:20],
        "pr_curve": pr_data[:20]
    }
