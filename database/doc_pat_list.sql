CREATE TABLE public.doc_pat_list
(
    username character(30) COLLATE pg_catalog."default",
    patient_id character(30) COLLATE pg_catalog."default"
)

TABLESPACE pg_default;

ALTER TABLE public.doc_pat_list
    OWNER to postgres;