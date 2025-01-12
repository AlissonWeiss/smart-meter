with consumption_data as (
    select
        e.refsmartmeter,
        e.voltage,
        e.current,
        e.power,
        e.energy,
        e.frequency,
        e.pf,
        TO_CHAR(e.measuredat at TIME zone 'America/Sao_Paulo', 'DD/MM/YYYY')as measuredattext,
        ROW_NUMBER() OVER (
                PARTITION BY 
                    date_trunc('day', (e.measuredat at TIME zone 'America/Sao_Paulo'))
                ORDER BY e.measuredat DESC
            ) AS rn
    from
        mtsmart_meter.etelectricalconsume e
    where
        1 = 1
        and e.energy is not null
        and e.energy <> 0
        and (e.measuredat at TIME zone 'America/Sao_Paulo')::date between ((CURRENT_TIMESTAMP at TIME zone 'America/Sao_Paulo') - interval '30 DAY')::date and (CURRENT_TIMESTAMP at TIME zone 'America/Sao_Paulo')::date
)
select
	sum(energy) as consumption,
	measuredattext as measuredat
from
	consumption_data
where
	rn = 1
    and refsmartmeter in $1
group by 
	measuredattext
order by
	measuredattext;