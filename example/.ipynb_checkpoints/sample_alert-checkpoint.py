sample_alert_1 = {
        "severity": "CRITICAL",
        "check_type": "report_readiness_check", 
        "table": "daily_transaction_report",
        "time_period": "2025-06-01T02:53:32.136584",
        "expected_value": "READY",
        "actual_value": "NOT_READY"
    }

sample_alert_2 = {
    "severity": "WARNING",
    "check_type": "data_recency_anomaly", 
    "table": "daily_summary_report",
    "time_period": "2025-06-01T00:53:32.136584",
    "expected_value": "0",
    "actual_value": "4.5",
    "err_msg": "Data is 4.5 hours behind expected schedule"
}

sample_alert_3 = {
    "severity": "CRITICAL", 
    "check_type": "cross_table_validation",
    "table": "user_payment_summary",
    "time_period": "2025-06-01T06:15:22.445691", 
    "expected_value": "CONSISTENT",
    "actual_value": "INCONSISTENT",
    "err_msg": "Referential integrity violation between user_profiles and payment_transactions - 1547 affected records"
}