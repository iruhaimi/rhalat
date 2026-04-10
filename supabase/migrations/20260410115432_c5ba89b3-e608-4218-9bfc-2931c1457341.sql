-- Fix security definer view warning
ALTER VIEW public.tour_operators_public SET (security_invoker = true);