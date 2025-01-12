with consumption_data as (
    select
        e.refsmartmeter,
        e.voltage,
        e.current,
        e.power,
        e.energy,
        e.frequency,
        e.pf,
        EXTRACT('week' FROM e.measuredat at TIME zone 'America/Sao_Paulo') as week_number,
        TO_CHAR(date_trunc('week', e.measuredat at TIME zone 'America/Sao_Paulo'), 'DD/MM/YYYY') || ' a ' || TO_CHAR(date_trunc('week', e.measuredat at TIME zone 'America/Sao_Paulo'  + interval '6 DAY'), 'DD/MM/YYYY') as measuredattext,
        ROW_NUMBER() OVER (
                PARTITION BY 
                    date_trunc('week', (e.measuredat at TIME zone 'America/Sao_Paulo'))
                ORDER BY e.measuredat DESC
            ) AS rn
    from
        mtsmart_meter.etelectricalconsume e
    where
        1 = 1
        and (e.measuredat at TIME zone 'America/Sao_Paulo')::date between ((CURRENT_TIMESTAMP at TIME zone 'America/Sao_Paulo') - interval '90 DAY')::date and (CURRENT_TIMESTAMP at TIME zone 'America/Sao_Paulo')::date
)
select
	sum(energy) as consumption,
	measuredattext as measuredat,
	week_number
from
	consumption_data
where
	rn = 1
    and refsmartmeter in $1
group by 
	measuredattext, week_number
order by
	week_number asc;