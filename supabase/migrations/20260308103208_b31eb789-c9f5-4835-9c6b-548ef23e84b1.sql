ALTER TABLE public.registrations DROP CONSTRAINT registrations_unique_person;
ALTER TABLE public.registrations ADD CONSTRAINT registrations_unique_name UNIQUE (participant_name);