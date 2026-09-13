-- Navii Live — acoustic cover repertoire seed (90 songs)
-- Run in Supabase SQL Editor. Safe to re-run.
-- Updates tags on existing title+artist matches, inserts any missing rows.

begin;

with repertoire (title, artist, tags) as (
  values
    ('Country Roads', 'John Denver', array['Sing-Alongs','Crowd Favourites']::text[]),
    ('Brown Eyed Girl', 'Van Morrison', array['Sing-Alongs','Pub Anthems','Crowd Favourites']::text[]),
    ('Sweet Caroline', 'Neil Diamond', array['Sing-Alongs','Pub Anthems','Crowd Favourites']::text[]),
    ('Piano Man', 'Billy Joel', array['Sing-Alongs','Crowd Favourites','Late Night Vibe']::text[]),
    ('Wonderwall', 'Oasis', array['Sing-Alongs','Crowd Favourites']::text[]),
    ('Hey Jude', 'The Beatles', array['Sing-Alongs','Classic Rock','Crowd Favourites']::text[]),
    ('Don''t Stop Believin''', 'Journey', array['Sing-Alongs','Classic Rock','Pub Anthems']::text[]),
    ('Livin'' on a Prayer', 'Bon Jovi', array['Classic Rock','Pub Anthems','Crowd Favourites']::text[]),
    ('Wagon Wheel', 'Darius Rucker', array['Sing-Alongs','Crowd Favourites','Pub Anthems']::text[]),
    ('Hotel California', 'Eagles', array['Classic Rock','Late Night Vibe']::text[]),
    ('Free Bird', 'Lynyrd Skynyrd', array['Classic Rock','Crowd Favourites']::text[]),
    ('Sweet Home Alabama', 'Lynyrd Skynyrd', array['Classic Rock','Pub Anthems','Sing-Alongs']::text[]),
    ('American Pie', 'Don McLean', array['Sing-Alongs','Classic Rock','Crowd Favourites']::text[]),
    ('Summer of ''69', 'Bryan Adams', array['Classic Rock','Sing-Alongs','Crowd Favourites']::text[]),
    ('Take Me Home', 'Phil Collins', array['Sing-Alongs','Crowd Favourites']::text[]),
    ('You''re the One That I Want', 'Grease', array['Sing-Alongs','Crowd Favourites']::text[]),
    ('Build Me Up Buttercup', 'The Foundations', array['Sing-Alongs','Pub Anthems','Crowd Favourites']::text[]),
    ('Dancing Queen', 'ABBA', array['Sing-Alongs','Pub Anthems','Crowd Favourites']::text[]),
    ('Billie Jean', 'Michael Jackson', array['Crowd Favourites','Pub Anthems']::text[]),
    ('Viva La Vida', 'Coldplay', array['Sing-Alongs','Crowd Favourites']::text[]),
    ('Mr Brightside', 'The Killers', array['Sing-Alongs','Pub Anthems','Crowd Favourites']::text[]),
    ('I''m Yours', 'Jason Mraz', array['Romantic & Slow','Sing-Alongs','Late Night Vibe']::text[]),
    ('Riptide', 'Vance Joy', array['Sing-Alongs','Crowd Favourites','New / Fresh']::text[]),
    ('Ho Hey', 'The Lumineers', array['Sing-Alongs','Crowd Favourites']::text[]),
    ('Hey There Delilah', 'Plain White T''s', array['Romantic & Slow','Late Night Vibe']::text[]),
    ('Chasing Cars', 'Snow Patrol', array['Romantic & Slow','Sing-Alongs','Late Night Vibe']::text[]),
    ('Someone Like You', 'Adele', array['Romantic & Slow','Sing-Alongs','Late Night Vibe']::text[]),
    ('Rolling in the Deep', 'Adele', array['Sing-Alongs','Crowd Favourites']::text[]),
    ('Hallelujah', 'Jeff Buckley', array['Romantic & Slow','Late Night Vibe']::text[]),
    ('Stand By Me', 'Ben E. King', array['Sing-Alongs','Romantic & Slow','Crowd Favourites']::text[]),
    ('Lean On Me', 'Bill Withers', array['Sing-Alongs','Crowd Favourites']::text[]),
    ('What a Wonderful World', 'Louis Armstrong', array['Romantic & Slow','Crowd Favourites']::text[]),
    ('I Will Always Love You', 'Whitney Houston', array['Romantic & Slow','Sing-Alongs']::text[]),
    ('My Girl', 'The Temptations', array['Sing-Alongs','Romantic & Slow','Crowd Favourites']::text[]),
    ('(Your Love Keeps Lifting Me) Higher and Higher', 'Jackie Wilson', array['Sing-Alongs','Crowd Favourites','Pub Anthems']::text[]),
    ('Proud Mary', 'Creedence Clearwater Revival', array['Classic Rock','Pub Anthems','Sing-Alongs']::text[]),
    ('Mustang Sally', 'Wilson Pickett', array['Classic Rock','Pub Anthems','Crowd Favourites']::text[]),
    ('Old Time Rock & Roll', 'Bob Seger', array['Classic Rock','Pub Anthems','Sing-Alongs']::text[]),
    ('Johnny B. Goode', 'Chuck Berry', array['Classic Rock','Pub Anthems']::text[]),
    ('Twist and Shout', 'The Beatles', array['Classic Rock','Sing-Alongs','Crowd Favourites']::text[]),
    ('La Bamba', 'Ritchie Valens', array['Classic Rock','Sing-Alongs','Crowd Favourites']::text[]),
    ('I Love Rock ''n'' Roll', 'Joan Jett', array['Classic Rock','Pub Anthems','Crowd Favourites']::text[]),
    ('Bad Moon Rising', 'Creedence Clearwater Revival', array['Classic Rock','Sing-Alongs','Pub Anthems']::text[]),
    ('Folsom Prison Blues', 'Johnny Cash', array['Classic Rock','Pub Anthems']::text[]),
    ('Ring of Fire', 'Johnny Cash', array['Sing-Alongs','Classic Rock','Crowd Favourites']::text[]),
    ('Tennessee Whiskey', 'Chris Stapleton', array['Romantic & Slow','Late Night Vibe','Crowd Favourites']::text[]),
    ('Cover Me Up', 'Morgan Wallen', array['Romantic & Slow','Late Night Vibe','New / Fresh']::text[]),
    ('Wasted on You', 'Morgan Wallen', array['Romantic & Slow','Late Night Vibe','New / Fresh']::text[]),
    ('Something in the Orange', 'Zach Bryan', array['Romantic & Slow','Late Night Vibe','New / Fresh']::text[]),
    ('Buy Dirt', 'Jordan Davis', array['Sing-Alongs','Crowd Favourites','New / Fresh']::text[]),
    ('Neon Moon', 'Brooks & Dunn', array['Late Night Vibe','Pub Anthems','Sing-Alongs']::text[]),
    ('Friends in Low Places', 'Garth Brooks', array['Sing-Alongs','Pub Anthems','Crowd Favourites']::text[]),
    ('Amarillo by Morning', 'George Strait', array['Romantic & Slow','Late Night Vibe']::text[]),
    ('Chicken Fried', 'Zac Brown Band', array['Sing-Alongs','Pub Anthems','Crowd Favourites']::text[]),
    ('Margaritaville', 'Jimmy Buffett', array['Sing-Alongs','Pub Anthems','Crowd Favourites']::text[]),
    ('Wish You Were Here', 'Pink Floyd', array['Classic Rock','Late Night Vibe','Romantic & Slow']::text[]),
    ('Night Changes', 'One Direction', array['Sing-Alongs','Romantic & Slow','New / Fresh']::text[]),
    ('As It Was', 'Harry Styles', array['Sing-Alongs','Crowd Favourites','New / Fresh']::text[]),
    ('Watermelon Sugar', 'Harry Styles', array['Sing-Alongs','Crowd Favourites','New / Fresh']::text[]),
    ('Shallow', 'Lady Gaga & Bradley Cooper', array['Romantic & Slow','Sing-Alongs','Crowd Favourites']::text[]),
    ('Someone You Loved', 'Lewis Capaldi', array['Romantic & Slow','Late Night Vibe','New / Fresh']::text[]),
    ('Before You Go', 'Lewis Capaldi', array['Romantic & Slow','Late Night Vibe','New / Fresh']::text[]),
    ('Say You Won''t Let Go', 'James Arthur', array['Romantic & Slow','Late Night Vibe','Sing-Alongs']::text[]),
    ('Photograph', 'Ed Sheeran', array['Romantic & Slow','Sing-Alongs','Late Night Vibe']::text[]),
    ('Shape of You', 'Ed Sheeran', array['Sing-Alongs','Crowd Favourites','New / Fresh']::text[]),
    ('Memories', 'Maroon 5', array['Sing-Alongs','Romantic & Slow','Crowd Favourites']::text[]),
    ('Girls Like You', 'Maroon 5', array['Sing-Alongs','Crowd Favourites','New / Fresh']::text[]),
    ('I''m Not the Only One', 'Sam Smith', array['Romantic & Slow','Late Night Vibe']::text[]),
    ('Stay With Me', 'Sam Smith', array['Romantic & Slow','Sing-Alongs','Late Night Vibe']::text[]),
    ('A Sky Full of Stars', 'Coldplay', array['Sing-Alongs','Crowd Favourites']::text[]),
    ('Cannonball', 'Damien Rice', array['Romantic & Slow','Late Night Vibe']::text[]),
    ('Fix You', 'Coldplay', array['Romantic & Slow','Sing-Alongs','Late Night Vibe']::text[]),
    ('The Scientist', 'Coldplay', array['Romantic & Slow','Late Night Vibe']::text[]),
    ('Iris', 'Goo Goo Dolls', array['Romantic & Slow','Sing-Alongs','Late Night Vibe']::text[]),
    ('I Want It That Way', 'Backstreet Boys', array['Sing-Alongs','Crowd Favourites']::text[]),
    ('Let It Be', 'The Beatles', array['Sing-Alongs','Classic Rock','Crowd Favourites']::text[]),
    ('What''s Up', '4 Non Blondes', array['Sing-Alongs','Crowd Favourites','Pub Anthems']::text[]),
    ('Zombie', 'The Cranberries', array['Sing-Alongs','Crowd Favourites']::text[]),
    ('With or Without You', 'U2', array['Romantic & Slow','Classic Rock','Late Night Vibe']::text[]),
    ('I Still Haven''t Found What I''m Looking For', 'U2', array['Classic Rock','Sing-Alongs','Crowd Favourites']::text[]),
    ('Knockin'' on Heaven''s Door', 'Bob Dylan', array['Classic Rock','Sing-Alongs','Late Night Vibe']::text[]),
    ('California Dreamin''', 'The Mamas & the Papas', array['Classic Rock','Sing-Alongs','Late Night Vibe']::text[]),
    ('House of the Rising Sun', 'The Animals', array['Classic Rock','Late Night Vibe']::text[]),
    ('The Sound of Silence', 'Simon & Garfunkel', array['Romantic & Slow','Late Night Vibe','Classic Rock']::text[]),
    ('Perfect', 'Ed Sheeran', array['Romantic & Slow','Sing-Alongs','Late Night Vibe']::text[]),
    ('Thinking Out Loud', 'Ed Sheeran', array['Romantic & Slow','Sing-Alongs']::text[]),
    ('Can''t Help Falling in Love', 'Elvis Presley', array['Romantic & Slow','Sing-Alongs','Crowd Favourites']::text[]),
    ('Yellow', 'Coldplay', array['Sing-Alongs','Romantic & Slow','Crowd Favourites']::text[]),
    ('Lover', 'Taylor Swift', array['Romantic & Slow','Sing-Alongs','New / Fresh']::text[]),
    ('All of Me', 'John Legend', array['Romantic & Slow','Sing-Alongs','Late Night Vibe']::text[])
),
updated as (
  update public.songs s
  set
    tags = r.tags,
    active = true
  from repertoire r
  where lower(s.title) = lower(r.title)
    and lower(s.artist) = lower(r.artist)
  returning s.id
)
insert into public.songs (title, artist, tags, active)
select r.title, r.artist, r.tags, true
from repertoire r
where not exists (
  select 1
  from public.songs s
  where lower(s.title) = lower(r.title)
    and lower(s.artist) = lower(r.artist)
);

commit;
