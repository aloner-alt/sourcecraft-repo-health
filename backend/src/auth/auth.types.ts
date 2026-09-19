export type YandexProfile = {
  id: string;
  login: string;
  client_id: string;
  default_email?: string;
  display_name?: string;
  real_name?: string;
  first_name?: string;
  last_name?: string;
};

export type SessionUser = {
  id: string;
  sub: string;
  login: string;
  email?: string;
  name?: string;
};
