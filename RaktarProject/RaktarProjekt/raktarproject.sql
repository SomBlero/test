-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Gép: 127.0.0.1
-- Létrehozás ideje: 2026. Ápr 24. 13:27
-- Kiszolgáló verziója: 10.4.32-MariaDB
-- PHP verzió: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `raktarproject`
--
CREATE DATABASE IF NOT EXISTS `raktarproject` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `raktarproject`;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `ar_kategoria`
--

CREATE TABLE `ar_kategoria` (
  `ar_kategoria_azon` int(11) NOT NULL,
  `kategoria_neve` varchar(100) NOT NULL,
  `alap_ar_naponta` decimal(10,2) NOT NULL,
  `meret_m2` decimal(5,2) NOT NULL,
  `megjegyzes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `ar_kategoria`
--

INSERT INTO `ar_kategoria` (`ar_kategoria_azon`, `kategoria_neve`, `alap_ar_naponta`, `meret_m2`, `megjegyzes`) VALUES
(1, 'Basic tároló', 500.00, 6.00, 'Alapáras kategória. (Tároló leírása ide ami a honlapon megjelenik ??..)'),
(2, 'Prémium tároló', 600.00, 6.00, 'Felszerelt tárolók. (Tároló leírása ide ami a honlapon megjelenik ??..)');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `berles`
--

CREATE TABLE `berles` (
  `berles_azon` int(11) NOT NULL,
  `ugyfel_azon` int(11) NOT NULL,
  `tarolo_azon` int(11) NOT NULL,
  `kezdo_datum` date NOT NULL,
  `veg_datum` date NOT NULL,
  `osszeg` decimal(10,2) NOT NULL,
  `berles_statusz` enum('aktiv','lejart','fuggoben','torolt','zarolt') NOT NULL DEFAULT 'fuggoben'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `berles`
--

INSERT INTO `berles` (`berles_azon`, `ugyfel_azon`, `tarolo_azon`, `kezdo_datum`, `veg_datum`, `osszeg`, `berles_statusz`) VALUES
(86, 48, 1, '2026-04-13', '2026-04-17', 2500.00, 'lejart'),
(87, 48, 18, '2026-04-20', '2026-04-23', 2400.00, 'lejart'),
(88, 48, 28, '2026-08-17', '2026-08-29', 7800.00, 'fuggoben'),
(89, 48, 5, '2026-05-19', '2026-05-26', 4000.00, 'fuggoben'),
(90, 50, 26, '2026-06-01', '2026-06-30', 18000.00, 'fuggoben'),
(91, 50, 2, '2026-05-18', '2026-05-31', 7000.00, 'fuggoben'),
(92, 51, 22, '2026-06-15', '2026-06-30', 8000.00, 'fuggoben'),
(93, 51, 16, '2026-05-25', '2026-05-31', 4200.00, 'fuggoben');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `megye`
--

CREATE TABLE `megye` (
  `megye_azon` int(11) NOT NULL,
  `nev` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `megye`
--

INSERT INTO `megye` (`megye_azon`, `nev`) VALUES
(17, 'Vas'),
(18, 'Veszprém'),
(19, 'Zala');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `nyito_kod`
--

CREATE TABLE `nyito_kod` (
  `nyito_kod_id` int(11) NOT NULL,
  `tarolo_azon` int(11) NOT NULL,
  `ugyfel_azon` int(11) NOT NULL,
  `kod` varchar(6) NOT NULL,
  `lejarat` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `raktar`
--

CREATE TABLE `raktar` (
  `cim_azon` int(11) NOT NULL,
  `megye_azon` int(11) NOT NULL,
  `megnevezes` varchar(255) DEFAULT NULL,
  `raktar_cim` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `raktar`
--

INSERT INTO `raktar` (`cim_azon`, `megye_azon`, `megnevezes`, `raktar_cim`) VALUES
(1, 19, 'Zala Raktár-Dél', '{\"irsz\": \"1117\", \"telepules\": \"Zalaegerszeg\", \"hazszam\": \"Raktár utca 1.\"}'),
(2, 18, 'Veszprémi Logisztikai Központ', '{\"irsz\": \"2040\", \"telepules\": \"Veszprém\", \"hazszam\": \"Ipari Park 2.\"}'),
(3, 17, 'Vas Telephely', '{\"irsz\": \"9700\", \"telepules\": \"Szombathely\", \"hazszam\": \"Hűtőház utca 5.\"}');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `tarolo_helyiseg`
--

CREATE TABLE `tarolo_helyiseg` (
  `tarolo_azon` int(11) NOT NULL,
  `cim_azon` int(11) NOT NULL,
  `ar_kategoria_azon` int(11) NOT NULL,
  `statusz` enum('szabad','foglalt','karbantartas') NOT NULL DEFAULT 'szabad'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `tarolo_helyiseg`
--

INSERT INTO `tarolo_helyiseg` (`tarolo_azon`, `cim_azon`, `ar_kategoria_azon`, `statusz`) VALUES
(1, 1, 1, 'szabad'),
(2, 1, 1, 'szabad'),
(3, 1, 1, 'szabad'),
(4, 1, 1, 'szabad'),
(5, 1, 1, 'szabad'),
(6, 1, 2, 'karbantartas'),
(7, 1, 2, 'foglalt'),
(8, 1, 2, 'szabad'),
(9, 1, 2, 'szabad'),
(10, 1, 2, 'szabad'),
(11, 2, 1, 'szabad'),
(12, 2, 1, 'szabad'),
(13, 2, 1, 'szabad'),
(14, 2, 1, 'szabad'),
(15, 2, 1, 'karbantartas'),
(16, 2, 2, 'foglalt'),
(17, 2, 2, 'szabad'),
(18, 2, 2, 'szabad'),
(19, 2, 2, 'szabad'),
(20, 2, 2, 'szabad'),
(21, 3, 1, 'szabad'),
(22, 3, 1, 'szabad'),
(23, 3, 1, 'szabad'),
(24, 3, 1, 'karbantartas'),
(25, 3, 1, 'szabad'),
(26, 3, 2, 'szabad'),
(27, 3, 2, 'szabad'),
(28, 3, 2, 'szabad'),
(29, 3, 2, 'szabad'),
(30, 3, 2, 'szabad');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `ugyfel`
--

CREATE TABLE `ugyfel` (
  `ugyfel_azon` int(11) NOT NULL,
  `nev` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `telefonszam` varchar(50) DEFAULT NULL,
  `jelszo_hash` varchar(255) NOT NULL,
  `regisztracio_datuma` timestamp NOT NULL DEFAULT current_timestamp(),
  `email_megerositve` tinyint(1) NOT NULL DEFAULT 1,
  `aktivalo_kod` varchar(255) DEFAULT NULL,
  `aktivalo_kod_lejarat` datetime DEFAULT NULL,
  `aktivalo_kod_probalkozasok` int(11) NOT NULL DEFAULT 0,
  `aktivalo_kod_zarolva_eddig` datetime DEFAULT NULL,
  `jelszo_visszaallito_kod` varchar(255) DEFAULT NULL,
  `jelszo_visszaallito_kod_lejarat` datetime DEFAULT NULL,
  `jelszo_visszaallito_probalkozasok` int(11) NOT NULL DEFAULT 0,
  `jelszo_visszaallito_zarolva_eddig` datetime DEFAULT NULL,
  `role` varchar(32) NOT NULL DEFAULT 'user',
  `email_ertesitesek` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- A tábla adatainak kiíratása `ugyfel`
--

INSERT INTO `ugyfel` (`ugyfel_azon`, `nev`, `email`, `telefonszam`, `jelszo_hash`, `regisztracio_datuma`, `email_megerositve`, `aktivalo_kod`, `aktivalo_kod_lejarat`, `aktivalo_kod_probalkozasok`, `aktivalo_kod_zarolva_eddig`, `jelszo_visszaallito_kod`, `jelszo_visszaallito_kod_lejarat`, `jelszo_visszaallito_probalkozasok`, `jelszo_visszaallito_zarolva_eddig`, `role`, `email_ertesitesek`) VALUES
(47, 'Admin Admin', 'abiadmin@blero.hu', '+36201111111', '$2a$11$7kJcT16UtQakA72t1XSwTujNBpYczukN0yBMNi68EuYUI4dKQn1zq', '2026-04-13 15:18:47', 1, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, 'admin', 1),
(48, 'User User', 'abiuser@blero.hu', '+362011111111', '$2a$11$XnBWPFzYnDeZFgpaup.4QO0ih9KKY3ZmgBe9gfrTs0vtHyPDxrfgy', '2026-04-13 15:20:45', 1, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, 'user', 1),
(49, 'Test Béla', 'yzoneeu@yzone.eu', '+36254441', '$2a$11$yOurCzuRXqEYYXo1SE6S4ewfWY793qAPahSWrJ7liZodZPwkcqnh.', '2026-04-24 11:16:00', 0, '$2a$11$6TX32Lj4iZOI/JcbpT35fu.QyxejRzZZshDJA6/rjUyNL65pgdC0W', '2026-04-24 13:31:00', 0, NULL, NULL, NULL, 0, NULL, 'user', 1),
(50, 'Test Béla', 'yzoneeu@gmail.com', '+36254441', '$2a$11$czYycho2Yy4HSuvbttUp0esp4eb05/Zh9c3JqqqKbCeY4yuW/v58O', '2026-04-24 11:16:30', 1, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, 'user', 1),
(51, 'User Test', 'hello@blero.hu', '+36202544144', '$2a$11$0Jrxtp4L1iOR/2lhUvSuh.dkXNa1AxMVgVfEkET4sgxPOcKjWXJUO', '2026-04-24 11:21:35', 1, NULL, NULL, 0, NULL, NULL, NULL, 0, NULL, 'user', 1);

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `ar_kategoria`
--
ALTER TABLE `ar_kategoria`
  ADD PRIMARY KEY (`ar_kategoria_azon`),
  ADD UNIQUE KEY `kategoria_neve` (`kategoria_neve`);

--
-- A tábla indexei `berles`
--
ALTER TABLE `berles`
  ADD PRIMARY KEY (`berles_azon`),
  ADD KEY `ugyfel_azon` (`ugyfel_azon`),
  ADD KEY `tarolo_azon` (`tarolo_azon`);

--
-- A tábla indexei `megye`
--
ALTER TABLE `megye`
  ADD PRIMARY KEY (`megye_azon`),
  ADD UNIQUE KEY `nev` (`nev`);

--
-- A tábla indexei `nyito_kod`
--
ALTER TABLE `nyito_kod`
  ADD PRIMARY KEY (`nyito_kod_id`),
  ADD KEY `fk_nyitokod_tarolo` (`tarolo_azon`),
  ADD KEY `fk_nyitokod_ugyfel` (`ugyfel_azon`);

--
-- A tábla indexei `raktar`
--
ALTER TABLE `raktar`
  ADD PRIMARY KEY (`cim_azon`),
  ADD KEY `megye_azon` (`megye_azon`);

--
-- A tábla indexei `tarolo_helyiseg`
--
ALTER TABLE `tarolo_helyiseg`
  ADD PRIMARY KEY (`tarolo_azon`),
  ADD KEY `cim_azon` (`cim_azon`),
  ADD KEY `ar_kategoria_azon` (`ar_kategoria_azon`);

--
-- A tábla indexei `ugyfel`
--
ALTER TABLE `ugyfel`
  ADD PRIMARY KEY (`ugyfel_azon`),
  ADD UNIQUE KEY `email` (`email`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `ar_kategoria`
--
ALTER TABLE `ar_kategoria`
  MODIFY `ar_kategoria_azon` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `berles`
--
ALTER TABLE `berles`
  MODIFY `berles_azon` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=94;

--
-- AUTO_INCREMENT a táblához `megye`
--
ALTER TABLE `megye`
  MODIFY `megye_azon` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT a táblához `nyito_kod`
--
ALTER TABLE `nyito_kod`
  MODIFY `nyito_kod_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT a táblához `raktar`
--
ALTER TABLE `raktar`
  MODIFY `cim_azon` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT a táblához `tarolo_helyiseg`
--
ALTER TABLE `tarolo_helyiseg`
  MODIFY `tarolo_azon` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT a táblához `ugyfel`
--
ALTER TABLE `ugyfel`
  MODIFY `ugyfel_azon` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `berles`
--
ALTER TABLE `berles`
  ADD CONSTRAINT `berles_ibfk_1` FOREIGN KEY (`ugyfel_azon`) REFERENCES `ugyfel` (`ugyfel_azon`) ON UPDATE CASCADE,
  ADD CONSTRAINT `berles_ibfk_2` FOREIGN KEY (`tarolo_azon`) REFERENCES `tarolo_helyiseg` (`tarolo_azon`) ON UPDATE CASCADE;

--
-- Megkötések a táblához `nyito_kod`
--
ALTER TABLE `nyito_kod`
  ADD CONSTRAINT `fk_nyitokod_tarolo` FOREIGN KEY (`tarolo_azon`) REFERENCES `tarolo_helyiseg` (`tarolo_azon`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_nyitokod_ugyfel` FOREIGN KEY (`ugyfel_azon`) REFERENCES `ugyfel` (`ugyfel_azon`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Megkötések a táblához `raktar`
--
ALTER TABLE `raktar`
  ADD CONSTRAINT `raktar_ibfk_1` FOREIGN KEY (`megye_azon`) REFERENCES `megye` (`megye_azon`) ON UPDATE CASCADE;

--
-- Megkötések a táblához `tarolo_helyiseg`
--
ALTER TABLE `tarolo_helyiseg`
  ADD CONSTRAINT `tarolo_helyiseg_ibfk_1` FOREIGN KEY (`cim_azon`) REFERENCES `raktar` (`cim_azon`) ON UPDATE CASCADE,
  ADD CONSTRAINT `tarolo_helyiseg_ibfk_2` FOREIGN KEY (`ar_kategoria_azon`) REFERENCES `ar_kategoria` (`ar_kategoria_azon`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
