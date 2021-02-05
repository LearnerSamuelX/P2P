CREATE TABLE public.doc_reg
(
    username character(30) COLLATE pg_catalog."default",
    password character(100) COLLATE pg_catalog."default",
    firstname character(30) COLLATE pg_catalog."default",
    lastname character(30) COLLATE pg_catalog."default",
    email character(30) COLLATE pg_catalog."default",
    patient_id character(30) COLLATE pg_catalog."default",
    session_id character(100) COLLATE pg_catalog."default"
)

TABLESPACE pg_default;

ALTER TABLE public.doc_reg
    OWNER to postgres;