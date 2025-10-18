--
-- PostgreSQL database dump
--

-- Dumped from database version 14.17 (Homebrew)
-- Dumped by pg_dump version 14.17 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: gunheejun
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    category character varying(255),
    userid integer,
    updatedat timestamp without time zone DEFAULT now()
);


ALTER TABLE public.posts OWNER TO gunheejun;

--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: gunheejun
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.posts_id_seq OWNER TO gunheejun;

--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gunheejun
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: gunheejun
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: gunheejun
--

COPY public.posts (id, title, content, created_at, category, userid, updatedat) FROM stdin;
1	첫 번째 포스트	이것은 테스트 포스트입니다.	2025-03-10 00:16:12.005002	\N	1	2025-03-17 00:39:57.523222
2	dsa	dasx	2025-03-11 23:23:06.704922	\N	1	2025-03-17 00:39:57.523222
3	새 글	ㅇㄴ	2025-03-11 23:58:48.314226	default	1	2025-03-17 00:39:57.523222
4	새 글	하하	2025-03-11 23:58:58.841625	default	1	2025-03-17 00:39:57.523222
5	새 글	ㅇㄴ	2025-03-12 00:00:49.212855	default	1	2025-03-17 00:39:57.523222
6	새 글	ㄹㅇ	2025-03-12 00:08:04.053188	default	1	2025-03-17 00:39:57.523222
7	새 글	ㄹㅇ	2025-03-12 00:08:05.880109	default	1	2025-03-17 00:39:57.523222
8	새 글	ㄹㅇ	2025-03-12 00:11:04.759911	default	1	2025-03-17 00:39:57.523222
9	새 글	ㅌㅁ	2025-03-12 00:11:11.041901	default	1	2025-03-17 00:39:57.523222
10	새 글	ㅇㄴx	2025-03-12 00:11:16.715973	default	1	2025-03-17 00:39:57.523222
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password, created_at) FROM stdin;
27	newuser	new@example.com	$2b$10$r6Gzpl51.afpXpY5RX6U5OFTd8TUKAl5sYlex2EP5.gj/LLcQdJfS	2025-03-12 21:09:23.249712
29	testuser	test@example.com	$2b$10$/RfWnr8bYpjdTsCgydGh1uFeT9p80sI1cqz1S3ewGBugtxQ6Fg52m	2025-03-16 18:14:05.711658
\.


--
-- Name: posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gunheejun
--

SELECT pg_catalog.setval('public.posts_id_seq', 25, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 29, true);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: gunheejun
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

