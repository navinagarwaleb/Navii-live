export type Performer = {
  id: string;
  username: string;
  display_name: string;
  bio?: string | null;
  tip_handle?: string | null;
  interac_email?: string | null;
  user_id?: string | null;
  created_at?: string;
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  active?: boolean;
  tags?: string[];
  performer_id?: string | null;
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
