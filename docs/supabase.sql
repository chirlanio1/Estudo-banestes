-- Painel PROVA: tabela única de sincronização. Cole tudo no SQL Editor do Supabase e clique em Run.
create table if not exists public.registros (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  tabela text not null,
  chave text not null,
  dados jsonb,
  atualizado bigint not null,
  apagado boolean not null default false,
  alterado timestamptz not null default clock_timestamp(),
  primary key (user_id, tabela, chave)
);
create index if not exists registros_alterado on public.registros (user_id, alterado);

grant select, insert, update, delete on public.registros to authenticated;
alter table public.registros enable row level security;
drop policy if exists "cada um ve so o seu" on public.registros;
create policy "cada um ve so o seu" on public.registros
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Mantém a versão mais nova e carimba a hora do servidor.
create or replace function public.registros_versao() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.atualizado <= old.atualizado then
    return null;
  end if;
  new.alterado := clock_timestamp();
  return new;
end $$;
drop trigger if exists registros_versao on public.registros;
create trigger registros_versao before insert or update on public.registros
  for each row execute function public.registros_versao();
