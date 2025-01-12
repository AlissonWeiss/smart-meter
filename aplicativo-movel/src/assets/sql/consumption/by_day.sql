with last_minute as (
    select
        e.refsmartmeter,
        e.voltage,
        e.current,
        e.power,
        e.energy,
        e.frequency,
        e.pf,
        date_trunc('hour', (e.measuredat at TIME zone 'America/Sao_Paulo')) as measuredat,
        TO_CHAR(e.measuredat at TIME zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24') || ':00' as measuredattext,
        ROW_NUMBER() OVER (
                PARTITION BY 
                    date_trunc('hour', (e.measuredat at TIME zone 'America/Sao_Paulo'))
                ORDER BY e.measuredat DESC
            ) AS rn
    from
        mtsmart_meter.etelectricalconsume e
    where
        1 = 1
        and (e.measuredat at TIME zone 'America/Sao_Paulo') between (CURRENT_TIMESTAMP at TIME zone 'America/Sao_Paulo') - interval '1 DAY' and (CURRENT_TIMESTAMP at TIME zone 'America/Sao_Paulo')
)
select
	*
from
	last_minute
where
	rn = 1
    and refsmartmeter in $1;