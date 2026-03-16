
ALTER TABLE public.game_logs RENAME COLUMN fg_missed TO fg_attempted;
ALTER TABLE public.game_logs RENAME COLUMN three_missed TO three_attempted;
ALTER TABLE public.game_logs RENAME COLUMN ft_missed TO ft_attempted;
