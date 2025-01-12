with measures as (
	select
		e.refsmartmeter as smart_meter_id,
		e.measuredat as measured_at,
		extract(EPOCH from lead(e.measuredat) over (partition by e.entity_id order by e.measuredat) - e.measuredat) as gap_as_seconds
	from
		mtsmart_meter.etelectricalconsume e
	where
		(e.measuredat AT TIME ZONE 'America/Sao_Paulo')::date between $1 and $2
		and e.refsmartmeter in $4
	order by
		e.measuredat desc
)
select
	smart_meter_id,
	measured_at,
	case
	    when gap_as_seconds is null
        then extract(EPOCH from current_timestamp - measured_at)::integer
        else gap_as_seconds
    end as gap_as_seconds
from
	measures
where
	(measures.gap_as_seconds is null and extract(EPOCH from CURRENT_TIMESTAMP - measures.measured_at) > $3)
	or measures.gap_as_seconds >= $3;