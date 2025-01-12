with last_minute as (
    select
        e.refsmartmeter,
        e.voltage,
        e.current,
        e.power,
        e.energy,
        e.frequency,
        e.pf,
        date_trunc('minute', (e.measuredat at TIME zone 'America/Sao_Paulo')) as measuredat,
        TO_CHAR(e.measuredat at TIME zone 'America/Sao_Paulo', 'YYYY-MM-DD HH24:MI') as measuredattext,
        ROW_NUMBER() OVER (
                PARTITION BY 
                    date_trunc('minute', (e.measuredat at TIME zone 'America/Sao_Paulo'))
                ORDER BY e.measuredat DESC
            ) AS rn
    from
        mtsmart_meter.etelectricalconsume e
    where
        1 = 1
        and (e.measuredat at TIME zone 'America/Sao_Paulo') >= (CURRENT_TIMESTAMP at TIME zone 'America/Sao_Paulo') - interval '59 MINUTES'
)
select
	*
from
	last_minute
where
	rn = 1
    and refsmartmeter in $1;