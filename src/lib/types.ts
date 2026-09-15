export type Performer = {
  id: string;
  username: string;
  display_name: string;
  bio?: string | null;
  tip_handle?: string | null;
  interac_email?: string | null;
  paypal_link?: string | null;
  custom_tip_link?: string | null;
  paypal_me_link?: string | null;
  venmo_handle?: string | null;
  cash_app_handle?: string | null;
  instagram_handle?: string | null;
  facebook_url?: string | null;
  custom_tags?: string[];
  user_id?: string | null;
  created_at?: string;
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  active?: boolean;
  tags?: string[];
  artwork_url?: string | null;
  performer_id?: string | null;
  created_at?: string;
};

export type Setlist = {
  id: string;
  performer_id: string;
  name: string;
  icon?: string | null;
  icon_color?: string | null;
  position?: number;
  created_at?: string;
  updated_at?: string;
  song_count?: number;
};

export type SetlistSong = {
  id: string;
  setlist_id: string;
  song_id: string;
  position: number;
  created_at?: string;
  song?: Song | null;
};

export type RequestStatus = "pending" | "accepted" | "rejected" | "played";

export type SongRequest = {
  id: string;
  occasion: string;
  song_id: string | null;
  song_title: string;
  artist: string;
  requester_name: string;
  dedication: string | null;
  status: RequestStatus;
  performer_id?: string | null;
  created_at: string;
};
