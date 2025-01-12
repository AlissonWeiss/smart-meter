WITH my_consumption_limits AS (
  WITH last_configuration AS (
    SELECT
      pc.entity_id,
      pc.dailyenergylimit,
      pc.weeklyenergylimit,
      pc.monthlyenergylimit,
      ROW_NUMBER() OVER (PARTITION BY pc.entity_id ORDER BY pc.time_index DESC) AS row_num
    FROM mtsmart_meter.etpersonalconfiguration pc
    order by pc.time_index desc
  )
  SELECT
    *
  FROM
    last_configuration
  WHERE
    row_num = 1
    AND entity_id = $1
),
daily_consumption AS (
  SELECT
    max(e.energy) - min(e.energy) AS consumption,
    'diário' AS scenario
  FROM
    mtsmart_meter.etelectricalconsume e
  WHERE
    (e.measuredat AT TIME ZONE 'America/Sao_Paulo')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
    AND e.energy <> 0
),
weekly_consumption AS (
  SELECT
    max(e.energy) - min(e.energy) AS consumption,
    'semanal' AS scenario
  FROM
    mtsmart_meter.etelectricalconsume e
  WHERE
    (e.measuredat AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '7 DAY')::date AND (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
    AND e.energy <> 0
),
monthly_consumption AS (
  SELECT
    max(e.energy) - min(e.energy) AS consumption,
    'mensal' AS scenario
  FROM
    mtsmart_meter.etelectricalconsume e
  WHERE
    (e.measuredat AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN ((CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '30 DAY')::date AND (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date
    AND e.energy <> 0
),
all_consumption AS (
  SELECT * FROM daily_consumption
  UNION ALL
  SELECT * FROM weekly_consumption
  UNION ALL
  SELECT * FROM monthly_consumption
)
SELECT
  ac.scenario,
  ac.consumption,
  CASE
    WHEN ac.scenario = 'diário' then l.dailyenergylimit
    WHEN ac.scenario = 'semanal' then l.weeklyenergylimit
    WHEN ac.scenario = 'mensal' then l.monthlyenergylimit
  END AS scenario_limit,
  CASE
    WHEN ac.scenario = 'diário' AND ac.consumption > l.dailyenergylimit THEN true
    WHEN ac.scenario = 'semanal' AND ac.consumption > l.weeklyenergylimit THEN true
    WHEN ac.scenario = 'mensal' AND ac.consumption > l.monthlyenergylimit THEN true
    ELSE false
  END AS is_limit_exceeded,
  CASE
    WHEN ac.scenario = 'diário' then 1
    WHEN ac.scenario = 'semanal' then 2
    WHEN ac.scenario = 'mensal' then 3
  END AS scenario_order
FROM
  all_consumption ac
JOIN
  my_consumption_limits l ON l.entity_id = $1
 order by scenario_order;