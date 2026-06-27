-- Migration: check-in de ingressos (rodar no SQL Editor em bancos já existentes).
alter table ingressos add column if not exists checkin_em timestamptz;
