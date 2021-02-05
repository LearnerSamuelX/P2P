CREATE TABLE public.pat_info
(
    patient_id character(30) COLLATE pg_catalog."default",
    patient_firstname character(30) COLLATE pg_catalog."default",
    patient_lastname character(30) COLLATE pg_catalog."default",
    doc_id character(30) COLLATE pg_catalog."default",
    patient_email character(30) COLLATE pg_catalog."default",
    birth_date character(30) COLLATE pg_catalog."default"
)

TABLESPACE pg_default;

ALTER TABLE public.pat_info
    OWNER to postgres;