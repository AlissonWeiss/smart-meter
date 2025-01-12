WITH monthly_consumption AS (
  SELECT
    max(e.energy) - min(e.energy) AS consumption,
    min(e.measuredat AT TIME ZONE 'America/Sao_Paulo')::date AS consumption_date
  FROM
    mtsmart_meter.etelectricalconsume e
  WHERE
    (e.measuredat AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN $1 AND $2
    AND e.energy <> 0
    AND e.refsmartmeter in $3
  group by date_trunc('day', (e.measuredat at TIME zone 'America/Sao_Paulo'))
),
price_intervals AS (
  SELECT
    e.price,
    e.startdate::date AS start_date,
    (LEAD(e.startdate) OVER (ORDER BY e.startdate) - interval '1 day')::date AS end_date
  FROM
    mtsmart_meter.etkilowattprice e
),
consumption_with_price AS (
  SELECT
    mc.consumption,
    mc.consumption_date,
    pi.price
  FROM
    monthly_consumption mc
  JOIN
    price_intervals pi
  ON
    mc.consumption_date BETWEEN pi.start_date AND COALESCE(pi.end_date, CURRENT_DATE)
)
select
	cwp.consumption_date,
	cwp.consumption,
	cwp.price,
	(cwp.consumption * cwp.price) AS total_value
FROM
  consumption_with_price cwp
 order by consumption_date;
