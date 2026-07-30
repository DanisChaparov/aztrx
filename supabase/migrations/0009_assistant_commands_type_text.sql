alter table public.assistant_commands drop constraint if exists assistant_commands_type_check;

alter table public.assistant_commands
  add constraint assistant_commands_type_check
  check (type in ('launch_app', 'run_dev_command', 'run_shell', 'type_text'));
