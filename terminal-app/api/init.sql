-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 17, 2026 at 02:29 PM
-- Server version: 8.0.45-0ubuntu0.24.04.1
-- PHP Version: 8.3.6

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_terminal`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_attendance_auth_log`
--

CREATE TABLE `tbl_attendance_auth_log` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `terminal_id` int NOT NULL,
  `attendance_context` enum('daily','event') NOT NULL,
  `event_id` int DEFAULT NULL,
  `captured_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_attendance_auth_log`
--

INSERT INTO `tbl_attendance_auth_log` (`id`, `user_id`, `terminal_id`, `attendance_context`, `event_id`, `captured_at`) VALUES
(7, 1, 9, 'daily', NULL, '2026-05-01 18:02:02'),
(8, 1, 9, 'daily', NULL, '2026-05-01 18:04:59'),
(10, 1, 9, 'daily', NULL, '2026-05-02 15:23:04'),
(11, 1, 9, 'daily', NULL, '2026-05-04 06:25:07'),
(12, 1, 9, 'daily', NULL, '2026-05-04 06:29:43'),
(16, 1, 9, 'daily', NULL, '2026-05-04 08:50:21'),
(21, 18, 9, 'daily', NULL, '2026-05-06 11:01:52'),
(23, 18, 9, 'daily', NULL, '2026-05-06 11:13:07');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_attendance_session`
--

CREATE TABLE `tbl_attendance_session` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `terminal_id` int NOT NULL,
  `attendance_context` enum('daily','event') NOT NULL,
  `event_id` int DEFAULT NULL,
  `checkin_timestamp` timestamp NOT NULL,
  `checkout_timestamp` timestamp NULL DEFAULT NULL,
  `checkin_status` enum('on time','late') NOT NULL,
  `checkout_status` enum('on time','early') DEFAULT NULL,
  `session_status` enum('active','completed','missed checkout') DEFAULT 'active',
  `sync_status` enum('pending','synced','error') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_attendance_session`
--

INSERT INTO `tbl_attendance_session` (`id`, `user_id`, `terminal_id`, `attendance_context`, `event_id`, `checkin_timestamp`, `checkout_timestamp`, `checkin_status`, `checkout_status`, `session_status`, `sync_status`, `created_at`) VALUES
(4, 1, 9, 'daily', NULL, '2026-05-01 18:02:02', '2026-05-01 18:04:59', 'late', 'on time', 'completed', 'synced', '2026-05-01 19:02:01'),
(6, 1, 9, 'daily', NULL, '2026-05-02 15:23:04', NULL, 'late', NULL, 'missed checkout', 'synced', '2026-05-02 16:23:04'),
(10, 1, 9, 'daily', NULL, '2026-05-04 08:50:21', NULL, 'late', NULL, 'missed checkout', 'synced', '2026-05-04 09:50:20'),
(15, 18, 9, 'daily', NULL, '2026-05-06 11:01:52', '2026-05-06 11:13:07', 'late', 'early', 'completed', 'synced', '2026-05-06 12:01:52');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_attendance_summary`
--

CREATE TABLE `tbl_attendance_summary` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `terminal_id` int DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `attendance_context` enum('daily','event') NOT NULL,
  `event_id` int DEFAULT NULL,
  `first_checkin` timestamp NULL DEFAULT NULL,
  `last_checkout` timestamp NULL DEFAULT NULL,
  `total_hours` decimal(5,2) DEFAULT '0.00',
  `attendance_status` varchar(100) NOT NULL,
  `derived_from_session` tinyint(1) DEFAULT '1',
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_attendance_summary`
--

INSERT INTO `tbl_attendance_summary` (`id`, `user_id`, `terminal_id`, `attendance_date`, `attendance_context`, `event_id`, `first_checkin`, `last_checkout`, `total_hours`, `attendance_status`, `derived_from_session`, `generated_at`) VALUES
(4, 1, 9, '2026-05-01', 'daily', NULL, '2026-05-01 18:02:02', '2026-05-01 18:04:59', 0.05, 'present', 1, '2026-05-01 19:05:18'),
(5, 1, 9, '2026-05-02', 'daily', NULL, '2026-05-02 15:23:04', NULL, 0.00, 'missed checkout', 1, '2026-05-03 16:37:56'),
(8, 1, 9, '2026-05-04', 'daily', NULL, '2026-05-04 08:50:21', NULL, 0.00, 'missed checkout', 1, '2026-05-05 14:53:33'),
(10, 18, 9, '2026-05-06', 'daily', NULL, '2026-05-06 11:01:52', '2026-05-06 11:13:07', 0.19, 'present', 1, '2026-05-06 12:14:04');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_auth_capabilities`
--

CREATE TABLE `tbl_auth_capabilities` (
  `id` int NOT NULL,
  `terminal_id` int DEFAULT NULL,
  `auth_type_id` int DEFAULT NULL,
  `auth_step` int DEFAULT NULL,
  `auth_type_name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_auth_capabilities`
--

INSERT INTO `tbl_auth_capabilities` (`id`, `terminal_id`, `auth_type_id`, `auth_step`, `auth_type_name`) VALUES
(7, 9, 1, 1, 'face'),
(8, 9, 3, 2, 'card');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_auth_policy`
--

CREATE TABLE `tbl_auth_policy` (
  `id` int NOT NULL,
  `terminal_id` int DEFAULT NULL,
  `group_id` int DEFAULT NULL,
  `subgroup_id` int DEFAULT NULL,
  `auth_type_id` int DEFAULT NULL,
  `group_name` varchar(100) DEFAULT NULL,
  `auth_type_name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_auth_policy`
--

INSERT INTO `tbl_auth_policy` (`id`, `terminal_id`, `group_id`, `subgroup_id`, `auth_type_id`, `group_name`, `auth_type_name`) VALUES
(3, 9, 1, NULL, 1, 'Afternoon Shift Beta', 'face'),
(11, 9, 2, NULL, 1, 'Engineering Group', 'face'),
(12, 9, 2, NULL, 3, 'Engineering Group', 'card');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_auth_session`
--

CREATE TABLE `tbl_auth_session` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `terminal_id` int NOT NULL,
  `attendance_context` enum('daily','event') DEFAULT 'daily',
  `event_id` int DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('in_progress','completed') DEFAULT 'in_progress'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_auth_session`
--

INSERT INTO `tbl_auth_session` (`id`, `user_id`, `terminal_id`, `attendance_context`, `event_id`, `started_at`, `status`) VALUES
(18, 1, 9, 'daily', NULL, '2026-05-01 19:00:31', 'completed'),
(19, 1, 9, 'daily', NULL, '2026-05-01 19:04:51', 'completed'),
(21, 1, 9, 'daily', NULL, '2026-05-02 16:23:00', 'completed'),
(22, 1, 9, 'daily', NULL, '2026-05-04 07:24:57', 'completed'),
(23, 1, 9, 'daily', NULL, '2026-05-04 07:29:10', 'completed'),
(39, 18, 9, 'daily', NULL, '2026-05-06 12:01:48', 'completed'),
(41, 18, 9, 'daily', NULL, '2026-05-06 12:10:44', 'completed'),
(43, 18, 9, 'daily', NULL, '2026-05-06 12:13:03', 'completed');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_auth_session_steps`
--

CREATE TABLE `tbl_auth_session_steps` (
  `id` int NOT NULL,
  `session_id` int NOT NULL,
  `auth_type` varchar(50) NOT NULL,
  `status` enum('pending','success','failed') DEFAULT 'pending',
  `verified_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_auth_session_steps`
--

INSERT INTO `tbl_auth_session_steps` (`id`, `session_id`, `auth_type`, `status`, `verified_at`) VALUES
(35, 18, 'face', 'success', '2026-05-01 18:02:02'),
(36, 18, 'card', 'success', '2026-05-01 18:00:32'),
(37, 19, 'face', 'success', '2026-05-01 18:04:59'),
(38, 19, 'card', 'success', '2026-05-01 18:04:52'),
(41, 21, 'face', 'success', '2026-05-02 15:23:04'),
(42, 21, 'card', 'success', '2026-05-02 15:23:00'),
(43, 22, 'face', 'success', '2026-05-04 06:25:07'),
(44, 22, 'card', 'success', '2026-05-04 06:24:58'),
(45, 23, 'face', 'success', '2026-05-04 06:29:43'),
(46, 23, 'card', 'success', '2026-05-04 06:29:11'),
(77, 39, 'face', 'success', '2026-05-06 11:01:52'),
(78, 39, 'card', 'success', '2026-05-06 11:01:48'),
(81, 41, 'face', 'success', '2026-05-06 11:10:51'),
(82, 41, 'card', 'success', '2026-05-06 11:10:44'),
(85, 43, 'face', 'success', '2026-05-06 11:13:07'),
(86, 43, 'card', 'success', '2026-05-06 11:13:04');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_event`
--

CREATE TABLE `tbl_event` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `affects_attendance` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `handshake` enum('1','2') DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_event`
--

INSERT INTO `tbl_event` (`id`, `name`, `start_datetime`, `end_datetime`, `affects_attendance`, `created_by`, `handshake`, `created_at`, `updated_at`) VALUES
(13, 'PTA Meeting', '2026-05-20 12:00:00', '2026-05-20 13:00:00', 1, 1, '2', '2026-04-24 13:17:43', '2026-04-25 09:23:36');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_event_access_policy`
--

CREATE TABLE `tbl_event_access_policy` (
  `id` int NOT NULL,
  `event_id` int DEFAULT NULL,
  `group_id` int DEFAULT NULL,
  `subgroup_id` int DEFAULT NULL,
  `auth_type_id` int DEFAULT NULL,
  `auth_type_name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_event_access_policy`
--

INSERT INTO `tbl_event_access_policy` (`id`, `event_id`, `group_id`, `subgroup_id`, `auth_type_id`, `auth_type_name`) VALUES
(41, 13, 1, NULL, 1, 'face'),
(42, 13, 1, NULL, 3, 'card');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_event_checkin_checkout_range`
--

CREATE TABLE `tbl_event_checkin_checkout_range` (
  `id` int NOT NULL,
  `event_id` int NOT NULL,
  `checkin_start_datetime` datetime NOT NULL,
  `checkin_end_datetime` datetime NOT NULL,
  `checkout_start_datetime` datetime DEFAULT NULL,
  `checkout_end_datetime` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_event_checkin_checkout_range`
--

INSERT INTO `tbl_event_checkin_checkout_range` (`id`, `event_id`, `checkin_start_datetime`, `checkin_end_datetime`, `checkout_start_datetime`, `checkout_end_datetime`) VALUES
(9, 13, '2026-05-20 11:45:00', '2026-05-20 12:00:00', '2026-05-20 13:00:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_face_buffer`
--

CREATE TABLE `tbl_face_buffer` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `face_template` blob NOT NULL,
  `confidence_score` float NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_terminal`
--

CREATE TABLE `tbl_terminal` (
  `id` int NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `branch_id` int DEFAULT NULL,
  `branch_name` varchar(100) DEFAULT NULL,
  `status` enum('active','pending','revoked') DEFAULT 'active',
  `date_created` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_terminal`
--

INSERT INTO `tbl_terminal` (`id`, `name`, `slug`, `branch_id`, `branch_name`, `status`, `date_created`) VALUES
(9, 'Main Entrance Terminal', 'main-entrance-01', 4, 'Bamenda', 'active', '2026-04-13 10:55:00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_user`
--

CREATE TABLE `tbl_user` (
  `id` int NOT NULL,
  `terminal_id` int DEFAULT NULL,
  `fname` varchar(100) DEFAULT NULL,
  `lname` varchar(100) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `user_type` varchar(50) DEFAULT NULL,
  `face_template` blob,
  `face_template_refined` blob,
  `fingerprint_template` blob,
  `card_serial_code` varchar(255) DEFAULT NULL,
  `sync_status` enum('pending','sent','sync') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'sync'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_user`
--

INSERT INTO `tbl_user` (`id`, `terminal_id`, `fname`, `lname`, `gender`, `user_type`, `face_template`, `face_template_refined`, `fingerprint_template`, `card_serial_code`, `sync_status`) VALUES
(1, NULL, 'John', 'Doe', 'male', 'student', 0x6b12b93c1a02783c760bfc3c09801abdc8c1f73cd94e393db1b5fb3cee2b8d3b164e223d27c36fbcab8603be5c99b73c131c5bbc62239c3c10ff043dcc1db9bcb878c33b7fb998bd0ba42c3c30815f3dc57ab53c432a14bdf28d013c7468293b8d5e84bc10a231bd6bfbb4bba1c7093dea8343bdc923843ddb21e13b57e049bcc70d9c3db8c1453d19e55c3bed8c04bdfac0903d76019c3d6e25fbbc10e5dc3b505a2a3d454425bcb9cf103d19735ebd1aab17bd95ff99bb3ae99d3d5326923d95440a3d95def93c685099bdb644cdbca5bb30bd0b6e773d9b88953c288357bd482b263db4eca73c48be1f3b4246693caa2ce5bdaabe81bbe0c884bc6172033d56e38f3c7384823b1b133a3dfd3316be43f92b3d442a473dd454203d1ce18b3dafc4b33ba679c13cdd79e8bd5ea5693ceb9a193d859f1d3dd78b843d2ece3dbb91b76ebd4281ff3c8fb73b3d1c6d353c60e0193e7eb508bc7b2b2cbdc997053caa0847bc66d13a3db308ecbb98b85bbbfaa6e6bc20b388bde6e94d3ca8ec353d06b6c4bc889dd2bceb4294bdaae08abd75dc0a3d9eeac73c72ff893d5c72bc3cd582923d7b75b03c981f7e3d60d8ce3d12125a3c0ac58ebcf22575bcef6498bd7b05b5bcc2bfe03c60b839bbad8747bc0b1e973d9584673c5cfb173d43bae4bb97ec14bb18b6be3b95e443bba8254bbc37e687bce648f93c924651bbc3df3ebca7ce92bbd8ac143cd95b863c0d2ba43b1dc4013eaa7bd83b9d0a89bddb748c3dfc08d33d9361283c2d5c113c653ebabac2f616bdbf3b2a3d5e5b2e3c39e40a3c4b23073cbe1c10bdcf4b84bd1cd5fc3ca9349bbde1495ebd6eebc9bcc44be03b97ab87bcb1cc51bb23ebebbcaab6213db2bfd4bd24ab8dbda6e2763bd95e9bbc3d9da4bd4a1113bde1e20ebb22abd939935ffabcbed640bc59965cbd67493d3db8cba4bc8449223c76dc303bba4f85bcf272533d5ffaabbb01b816bd415924bc6a68cabc59d2bebce9cc29bd60a557bd74de853d902dd1bc05e79bbd5a07703dca61b13dbded5d3dc4047fbd735d9bbd28820cbd061d883c006af0bc5877623cfab421bd298d2c3c6d9c993c3ebe1abd85de9d3c4cf53bbdd60004bd7393c8ba2693d0bb81c659bc88838d3da2a71ebd4ca602bb35195d3aed45823cf7e66abd7735a5bd3e37743b8e14f63c5748823de7620f3e7067173cddc2b5bc8e014c3dfbdbef3c6ee8703cc31e83bdafaeb2bcfa73ef3af12a10bd3cd1c03d1f6dd83ccd23f53d3059e1bbed036cbc1b66bd3b757493bdfcef9f3bf45d11bd13ec423ceca34f3de71af1bddac718bc0a4a283deb49e43c1830afbc530c023ce6cb01bd7ee19dbc4bb1d03d04d07abd2bdd89bce172943da53a2bbde41c153d1fc96b3c8f3b80bc51c6793c04acc53c236918bd83bfb7bc1ec2983bb4c408bd4df94a3d1d1d313d62e2b6bcd43b0cbd063aa93d2721a33c243b0ebce787053ddcdae73cf7a08fbdfc6188bcbc52a4bd3a8ee93b79e6033dbe7a58bb7c50eb3a5f396dbd918c5bbb6109f43d1fbdedbc6683783dac8609bde134f0bc6d809b3ccbf2b9bc649f073d686cddbcc9246f3ce4f5133d06de14bd5b45423dc4bce7bb69bd3dbd450b223c57d5d93c94870ebd8f7813bd3491483d74d4fc3cfc8ee83c9ef2e6bb57a933bc379c15bd142e333d5ca54cbd6a28acbd093d43bc23d62a3cc96a34bcec2fca3c65573dbc84cc133d1e1ad93c9d24993a6a01edbce576f7babb9f9fbd4cab443b020c493de3639a3c6abda03dc4fa5abdf49420bc49fea03c89c256bcf2970e3d75730c3d85de0bbd8fe830bd3527dd3c52e396bd4192c3bcef57cdba698531bd613c643c4e213b3dd76f0d3dff7582bd64d481bb47c3eabd8a9c1c3d65c1a23cb128393c71fe82bd6e2b61bd344e88bdba3db83cc5035cbc0a73d03c335dc13c7330503de5151b3ccb75ea3c8a9d153da1898ebc58eb46bd9c3b0ebd3326623d9f9d30bd6f46123d6c49f83b3df79cbdc8a418bd52c96bbd52c328bc1550223d708cce3cdf17c73c1da4acbb6b0c99bc5c5e8c3dd51fc23ce92ac93c86ed663d9cbf283caf4dc23cc874bebb4d1b893d9ad7a73ccbb10e3c0be12f3d81a0d5bd61e6aebc11dc0e3d07d1e6bbf9ff19bd0e2dae3d44dc093b5b5a893d14b4f7bacc0c9abcaac3bfbc6358b9bc6aa23d3b2272ed3c480baf3c39f2c8386d0f563dad10a7bc5b89b7bc9a1deb3c6c4d63ba3ddb0cbc98571fbded2ca2bd9d590ebe4d919b3d2d9c54bd0b1bccbb23a8863d4382783bb75825bc7cd5353a96741a3d59b347bc59b1eabc64d78bbc3689b5bcf42afebc4b2e55bd4f5b68bc19a19b3dffcd003c6c31273ca49c523c3e04823d7630063d2b15753d425bb43ba90fb13c5066ddba24be153da8983fbc0f913abde81e47bc869b84bdafc1da3c5b836ebd19e0f53b25d955bd8fc92e3c301d34bd93454e3cd52f96bd891affbc770db03c9d52173d84969fbcf1cad43a452990bceab6103d90f6de3ce384cb3cd7863f3d986382bcced812bd40bfaf3a4db861bd4dd2fcbb37c5d53c475d19bcac4733bdd025913cc2790f3db05e783d968ea83da4fefd3c2c90e3bc32fbc3bbc9d6e03c6f5a023c779ec13b5776fb3c491d493bf596bf3dbc9cb0bd31b178bc4567a7bcea13053d2a8ababd2f1f2e3d3cbc4e3d8dee71bcd13a3f3b37b1a0bc9b68353da6c526bb31d6bab90a0b113d1dcb4abc11a4a83de8739abd63668d3ceb6c523da79a9bbccd2b073cfa11073d0c1d6dbb4678b23c2f6a553de4c38e3c0baa2c3b63a30c3dccb25a3da1e695bdbd96c8bc6528b8bd9b1d79bd448a69bad255bdbd6b08debd98bf533c2b4d473debbc7fbcd31a6b3ce84d56bcb6edb7bd, 0xbe047abc0f4e4c3ced11283c3c2cb1bbb286713d7a8d153d87e2fc3c551875bce90812bb8dfcc83c5040b1bdd1f4653db2958e3cac462d3dd371a63c883190bc337bcbbcc20f66bde2036dbbd542bc3d9e65273de84c03babccec2bc91aea1ba46b0f0bc1cfa323b6a1d96bdf91df33c476b2cbc6bb8f73d8d4485bc1d3fa6bc8389383d776c3a3d102ea5bc07bc1ebd4c48963bdf381d3b704aea3c52e614bd2f651f3dd0be9bbd0bd8133d7acfedbccd997abdc98a253d5dacb63db1c2933dc753063e2cc0d73c27db74bd00a38cbdf4a2f83cf5286e3d9561403ce90fa2bd7292b23c86ca87bbcf462ebc3bde0dbd063d23be6a859ebb508a363c7a96a03d04cb9fbb1a6fa7bc88044bbdc80b04be1639123d5aac3e3c2efcf33c4dd3673d82a4db3b390c1a3d40baacbd22c54d3beaa13a3c60aa743df44d633d47aa613aa0cd60bd4d1a813dc9e03b3c96e0243ddcd99b3def7b5cbd2997d8bc68ee2a3b1e0fa1ba7589f7bcff69e23ccd1f5e3d39ebdcbcf57e56bdda433a3d0277f43bc42d50bceb9427bd814d9ebd8ba810bd35ff1f3dd194aaba0e41773d15558cba8859a63cd4c274bc3ef69c3d1f2896bcde4492bb26c8643c76a479bc74148fbc766f05bd89376c3c916317bbf73ac1bcce5b583c0abcb53dbcef6bbc73b13ebcc0b2b0bca1f824bdf385b83b800390bd5881873da19fefbba73c4abb964624bc6a6cd5bc94ea03bddc8bb93dc9f4053c52750d3ec2009abcbf0636bdf06066ba5323ef3c3c19b13b946d88bdf8fcc23c5f004bbcab9b163dd58a98bb4aa43dbb4ad26c3c4506f9bcbd6193bd9295133c9143a4bde67b85bde6728ebc5dc35abc12ee023d9fe2aa3c2cb9833be1f6c43cf5a347bd0c25abbd08fc2ebd24b1803c3ae0d2bd288fbaba6ffd663ccc83a5bcbfaa87bd2aba5d3c9b9a0abd286d1f3bec9846bb72590ebdb81a403d9dbe373dc099fe3c39a28639592f7cbcca70183aaee6a3bca6232d3d0beb66bd12211cbddae3c8bb580d163ddcbd55bd71ed693db0d89f3d0bf75e3d89b386bd8b4c6abdef05ec397916633c68556a3b04b0a5bbdc86a1bc070de9bd376f9a3c34f65abd5d8a423dad3dd5bda83ae8bcec487c3da7d5b03ae419eebc56492fbcb707b5bc7ed781bcefacc73ccb841fbc2c5fffbc1bdab4bd1105b93c6404133cd9ac113d52ad9b3dc6068fbc4eeaffbc5897763dc8d344bd13d972bc190111bc0063023d63f5203c847b55bcf5f78e3dc2d45bbd94918f3d702dc13c282a48bdb3d23f3d651318bdc9361fbd48fc303cda9259bc704c493c23c8b2bdd057353d23842f3d0a9e5c3c9ad89fbc08f179bce9c71bbd2e419fbd639bbb3d3c8109bc892a5cbd10a0373d1a0850bd4cac8c3de13bac3c7e14dd3c0183c33bbdd30bbd176c5abd17fd2abd6158873c1e5c6b3ddcb3543c2ffa063dd55ba7bcc0eb27bc2ab2d43d61d9b03c3e1c323c167f3d3dad83233d016e93bc73b9c1bdc95f0cbd2091173d4782d83c423d733cf51f043b3fc677bc20a60339727e523ac9ac953cde18973c9ffe81ba9dfb03bd9e4b9bbc738707bc2c903a3d8ac1d93c47a624bb03178b3c2e0b91bd7f2c1b3d5f5ab4bdaf8907bc079410bb4d17be3c5a9208bdd58c243d05e25d3c39f585bb235effba2dab37bc468a85bc38a788bd410f5b3d3610a53bab7c56bddf73b83d903e00bd076f5cbbca3eccbcb54f42bdccc2abbcc456a33c421fb1bc1ec2f5bb2817b23ce1023cbcf06227bcc455933dfbfce73c05ba403d279278bd5efea3bd5d110bbd2be1c2ba2425c33c9b1bff3c11616abd10ed37bc375a24bdbe0c0fbde8e19fbc279149bdad0e963cde610db9e00d7d3d9adebebc012fd7bdff80bd3c31fbffbdc549cf3cdd1c483dd8f94a3b0fbd3cbde6ba0fbd937cbbbdc561023bd844343c53b3e13d17a7bbbcf170953dcdec463ddcc37f3d39898a3d1aa97dbcf892a1ba77a7563cc2a305bdd58e2cbd558fab3c168b0f3dc8bd9cbd6e72a1bc38d936bd20277bbbbc7cb7bc5ef1a6bc0617d0bda4e7cf3b7d990d3cfe66473d97479a3c4f10103cc12edc3cdf68403d49155b38aea1bebc34c73a3cec8fbbbc419230bd4b09363db03888bdda5313bdd7b5253d4da9e53a00039a3c5ab0713d35747c3cc017f93c13c24ebd4c68143cb8fb23bdce5fa7bbf11caa3c5767d73c747d96bb0efc343cb5c20e3c814906bd7d5834bd0a8ec7bb9023033c9612553d6ea9aabdcc20a4bdd32769bc62d75f3d6127d7bc81d901bc54c18a3dea25e43ca9fe74bdd2afb63bc2e7543cdd6597bb78a5b73c0af7a3bcfc76e33cf599ecbc5cd78d3a427c98bce8ebc03d1c3b223ddadbf83bf540653ca210be3d13f147bce768133dcac1913cb7a7633cb92a83bbad9c273d2baf443db39866bdb1cc90bcad8decbc3fd3303d04043cbda00557bd5bea7dbd65518bbd554fb1bc7412873cdb44d0bc1ec3703c2e716cbd5b15b93d9757efbc14bc37bd4cb9bbbc6bc6463dbaf8eb3c33bb213d35a7743d80f5e2bb99429ebdf9b101bb9008debccde1f1bc0bc6d43cc53c91bda49f1cbd8daac8bc4bc87d3c69a2153ddcf5c43cd2fcb13c9e9152bc03550bbd59baf83c7a7f08bd25a36d3dbd33bebca837203c9f9f353d2405babd56998bbca499e23c5184d63bb66609bd0a11473d5c5bba3c48c7b3bb368a503d023495bd68525f3dbaa728bdd7114c3c57b4723d134a313c4a55853daa7329bd4bcf923de3cdb63d4486d4b94670b5bc56b4d53cab4247bb3a493abd60d7073da4f810bcc3c785bd2bd11e3d20f0623ca64680bc4a62c73aefe30ebe2e5c16bdc7ec8cbc3d5f73bd2973bbbda8e59239def50c3ce76a803cd59aa93c30ec06bc9f9e74bd, NULL, '1234567890', 'sync'),
(17, NULL, 'ichami', 'brandon', 'male', 'staff', 0x99e53fbc8a48413bc1ba663b8ed003bd7c56f53c2954cb3b27feb43c9b08d53c88a9a9bc3c51153d2cb2903caffa3a3b3fb59ebd64341a3db20c5c3c5605263de74385bcca0040bd3f1ead3c4fea8d3c48de623d7da8243d21ecff3b8b9bedbbb9c9a3bcf9a7dbbc622d073d125c8b3d9aee343cc7cb633d440fb5bb7489163c978c6c3d9e4a323d3c1df3bbc8325d3d0bbe62bd63a7233c7514b43dc3fa10bd67dfb7bbb09a9abdd8e48f3b732734bcc407fabc891d42bd1ce24d3cf8557b3c3862fa3c29c75a3d98356dbd21e358bd634f003e5d228a3c59b24d3ded5c1b3d5635c93d02bc3f3c6983623cca1e763d1e3ef8bc350c033dfd591c3ceab3963d8b00723b229a99bdec5ef4bb8cd5a7bd04f1b03d29b71c3b30c00cbe36fd353da81bc8bcfb170a3d8e16acbd5ebe873c802540bcb734083d0db4373cab7601bd113548bd5f9ac13c1f108d3dad97173dd88de33ce33ac23c10c893bd35ae473daae89c3d7e67953ce594313bfd86933c16e7093b4f19803d9068ff3cdb8e3cbc471d13bc2355cb3cbc27ebbdb973003de4cf313d8f06573dcfd7153c0fe9a9ba628da43daa7dafbc71460b3d1c018bbd5722b0bc842aa6bb052f2d3bae0800bd81fba03d37fb3ebc8ffcd43c57bb073c46ea213c59662c3d01928d3be9fe08bdd94f08bc7c27e7bc4c6f8d3df65b8dbcc5ac8a3d6ef6f53c7faeacbd57fb363d2eb5cbbbb7b3683c6002d73a34387dbd92c1aa3dd83701bd01bd2ebd2d5fb53c17d0653d8fac78ba706780bcdc5ece3c062b0b3cba75b13d031c413c749aa03a62f8613d77662ebda9e9a2bddbd81e3c724f80bd77d192bc545150bd2b43143db0ab2b3b1679ab3c04d38f3d9bf934bdd94cf73cfe86bdbd4f4986bd0d2e7a3c4b1a80bd32889ebc796489bb5a7779bdf14a653db171983b291a673d06805ab89d93b8bc4f619c3cb22eed3c8808823d4f1230bd82abacbcd5dde23c9763233b32a05bbd4002c73cdc6a6ebdfab7c13c402695bdb7fb303db31a2fbc28c86fbcadab5d3d5f0d043dfba407bd00a65bbd9bdf103d69e374bc71ae333dfb10e73c91108cbd0d333ebd2a3dd73cd8faed3c35f5743d71cefdbc041463bda2f91fbcb6ece23d760adc3c70335c3dede86c3b8cad2d3bbdeebebc86e734bded715abdd9109dbd32a3d13ca32e083d4148723de256d63d4c8dff3cbac88e3c5a9761bcdf8a03bb922ee83c7c722fbc448a743b612a6bbd1780bd3c7778acbcffd983bdcc43a73ce90419bdec9b79bddc4dc53c0e9be53c6737853b45829d3ce4779ebc681de13a732c44bb062d6f3df8b88fbc2d4fcd3ba08c993c3830813c0f466fbdbd1eedbce826823dcccef43cbf11f93cbf810c3d406bee3c3ab730bd3ed19d3cfad97cbdd8fd133c5e5ba1bcb3eedf3c568fd6bc6d16af3c3d4e5d3da7c8cb3d0a77d5bc839631bba329adbd46aef33cfa658bbca6366d3dde0dd3bbe0e6273dacb091bc178538bd87e917bd6de6bdbc6815913cf2ac183d4eb1e2bcddf30abb0bb93dbdf20224bd514accbcf64aa03d7af34bbcee060cbc8dd5713c5c73993df73abd3a8e49563d89c218bd28bf80bb3b20bfbcce5d5cbaaf1c71bdaf5955bd0255b3bc68f406bdf8f924bde7c883bd3737083d25c79a3da1781e3da3b7f6bc160bba3c2b90c33c3edc42bc45e77b3bf8dd32bda5336c3dedbdaebd3c9c85bdb9c2413d9db68b3c135c9a3c0f83033d65ddbb3ac73a3abd3c6fbd3a39ed43bde23745bc100f933dc67049bc7340863d4b01dbbbb5cb5f3c0b7d85bd4e11423ddd7f183cc3689b3d9e7218bd61e9893d0b521c3da76e8ebce16c533dc3aa39bc86e9153bc0e94dbd21cb30bdb36ca83c75f7873b10527d3d5ea51abe7caef1bc0aa5073d0dbeec3c272949bdcb3a2e3cd4e8c63ba05a2dbd10f815bd1a62703c0f0ea7bde412b83d3faf3f3df763933c38a9b23cc1002ebce11930bcccb156bd63ac63bda03ddebc4284963d21e1c63c4044fa3bcd57b53c9125d8bc72f354bdf3e564bd3ae296bb7bd48bbd354ef43cde80aa3c5c0c433c4ef696bdbf0f9d3ca3fd2d3c74662c3c24222dbb1e0d7c3c3561683db6f429bd2803c03c9aa576bd52512ebda53256bc536a0bbde1dd1bbd6e8f13bbc4d7d73c09508cbc01b1a1bcdd5a8abddba113bdf5347ebc1ae50f3d098f843a44212fbd41098c3cd1c5c0bdcd790739eea8abbd6a3c0b3b1c9fa03c64bd8e3c1c9b4abd31ad4f3d48ce37bcbe9c10bdeed9b93d09368f3c70ad29bd4ca102bc7619973d8c604abbd7f485bcb07d4ebc579d873c52f2fc3c04f0043db677f8b9f2318abd95278d3ddc95c1bc8c43273c6e3d4bbc8ccf333d850ba23cf1877f3d1f079b3caacf66378839cbbdf8d7de3cce798d3c415b903df994b9bcd7d0a4bd61c5593d34e544bd292e1a3db87be2383d98dbbdf02f933d2a99b2bdde33503cb119e5bc4229f63bfb08e33cb78bccbd24123e3d6fe158bcfb560fbceaf9bbbb35ccdebc6e704c3c33faf03c6e64353d7b6affbcc9fef1bda8ad01bdc695fabc2106d43c4b92d83c7e1079bd2821c1bbf1561dbd74473f3d5da3063d3bc387bc3edacebb2375f63cb8f79b3dac41243b260a6abc7141693d6ce4ebbc14d0933bcec8913d4d04d6bd06d939bd6b8b41bd2a21c43c7bc851bda8b92f3df9a296bd85af32bd7f19143c21bbc1bdc98b30bd2b3ff4bcacfb85bcd1855c3cbd33be3a7de0e03ca241de3cde4007bd3792813d831ef6bcab612cbd8385abb635aa6bbcbe7918be32d19d3be562b43dbf9b683c6b5becbcfba87abc6a46593df8258dbc51afe7bba170e83caead84bda43b063d04f96b3c6f868e3cea6c513b9722f4bbfb15fb3cdac8813d46490b3d, NULL, NULL, '1234567888', 'sync'),
(18, NULL, 'Marry', 'Anne', 'female', 'student', 0xa9dc653ca4f0423a3239303d714c8abd1a6c643ded66af3c5a6cc93ca217babcc0413d3d9de8e8bb471a4fbd2091b13d3a4ecbbc7cbc053dfac325bc65a1bb3cf916663b5a2482bdb46b313bcbee8e3d61d9af3c0f8c173cc4e5acbcc7eb42bccd829cbb026a36bd594ffebc7595273d1bd91bbd6b93873de82bde3aa9d37bbc63c5a9bc4384613da5eccabc5884aabb3645543c67978c3d84669f3ca378563cbab25c3df55648bd7d4b8e3d229c26bdd98254bba528e2bcfb531d3d5c8ba63cf689563d2140423df24290bd46a310bd97b1713d3f71b93d86130b3d14b81fbdb90d8f3d2a1b84bcbb34363b181eebbc963033befbb8173da3265dbce55d503d6fb4233da3e67ebb9335e5bc4ba920bee6a9043cc27c6f3c6ebd203d963b833d11e4703c6df4143dda2964bdf3ee0ebd5c425abbf2ce0d3dfaa1053d162b1dbdd90759bd558d6e3d32ad9a3cd04e54bb3af5b93d0a054abdda7b8abd8a33e5ba199aeabb62d3ab3b5eaeaf3c4b25063d91393abc81a82fbd9051603db897983d23e157bc71a032bd05b57abde9e048bdcf22623d2fdd943c2302343de64b9b3baee23a3d7e442abdf8cf403d5213ce3c6f7f19bdf21375bc8df7e7bc2e7b68bd7ed4a6bcf01c213d3ace863b4d360cbc8110ca3cc5b8573d35df773d8206e53b81237fbd5add713cabd34dbb7aee98bd59f2f53c908d213d42e5edbc5d1beb3bfff167bc2580953c4597033df377c03bcbe9143e4359e2bc7f5789bd57bf4d3ddf42123dd2f480bc95e065bdf6a5243bd44be03cff4ea53df0e5b83a501e18bb80ea063bea1f97bdb74fa7bdbbfc9f3c700706bd8d34d0bc1e5cdabbe4d5e23c1212583d10a02b3d697600bc1c171b3d595fa6bd5e6c7abd6c16923cd0b9ce3c113291bd385e05bdbc0397bca65406bc5690bebcbd0fcebb2a13c5bcc947c23c03332a3c78dcf7bbe6f7ce3c432d023db35dc13d4a0e7a3cb40603bcdca88abd050df83b87d73b3cbe2ae1bb41abb1bd7929ef3ca44835bcaa5d9dbd81c5a33da4208e3c932b3c3d7c156fbd4732ccbc369fccbc6f5314bda78fc33c1f20083d175b2dbd8bd7d8bb32642d3d089d963bc5447e3d196372bd40f3613bc971a23ca9a4503cab7db13a902916bd4cfa0cbdecd1b0bc1d5c2a3ba71eabbc70bfa1bda4f9b0bd1182793c8aa9a13cec09ba3df98a8e3d0966debc2beab43cc5f8b6bb552c07bd0d5487bc94563ebdb318cb3c5461eabac8785cbdd346ae3d5833dcbc04dba33da4b437bb7a8e55bd07b02f3d90e45dbd109decbc2b95163cd7c6f93a52adee3c717f8dbd0a794c3d9ef5b83d2c28c93c4b2efc3cc15f383c12ab03bccf3d88bd5ec2b13d76a164bc77a4253d4ba4f23ccd66f3bc1ac6423da0028ebbadb5563bb5701abc01ba373cf4981dbc505198bd869fbd3c409e8bbc66fa3f3db0956c3cffbfbabcf80152bd55c49c3d1e8667bc3787ba3c09e08dba7fa2ddbbd3db4bbda8ad7bbc7ed99cbdeed43c3d94021b3d48bbdcbc927d12bc881e5d3b5df30a3d37e2d53c12eac3bb344a0c3d963e66bcbc289ebd8f0d3cbcba54edbc4416623d4cf97bbcde6b05bc8fb74c3d1b69a4bd1865a83b0c5583bde2aeb6bbd4bfc8bc1b855b3d379721bdca07533c6a80ff3ccf23963b2a29613b5db5583dad36e7bcf30f2cbc4843ee3d920169bd15ae8cbd64f9693d8a3865bd616440bdee948c3ca96c333da907b43df75356bc56d11c3857f30fbd158bdfbbeba608bd0897eb3cb736613d2b9b3ebcd5b4573de10118bddd6803bd06840b3d45d26db88cc70d3d8e64873d0574fdbc1aa767bc36da50bc76e812bda70cb2bd43940bbdd2cde4bc94e794391b851f3da8ca633db9f6b3bd48593b3d8a2a1cbe2b31823ced296f3ce79ad8bceea39ebd0d37bdbc32c490bdc911a5bcc58e0a3d45357c3d868254bd2a4c093d8ccc8e3d367c5f3de01fb43cac8e693aaccb9f3bf99693bc1516d23c72e436bde5730d3c98799e3be5acdfbd8ed15ebcf15285bd30dd7abb67e3d5bcf929523bab3dd6bc3f85d53b541b16bcd79b483d1ebd52bc81053a3db4269e3b90588d3c5d0ccbbc50ea14bd72b1643d9499d6bce9bb7dbc5ada043dfbbda8bd7c8055bd8bba563cdc606b3ddf6273bc8f54643dfb1ba33c03503f3df4d6953a10bde43c120c4bbc05f5ff3b7b1484bbbde0593dc819c1bcd524473d98d86e3d406673bc765b15bd01f80f3db542073d70b31a3d6000f0bca218b4bd27e74ebc82e8c93c42fbeabccaea103ca23e5f3d5f3230b7c2bd1abc133a58bc132e02baacf4aebc024ebfbb835176baebc324bc29d405bd28644fbd6d0e0ebd1912cc3d8efd093c27129c3c713c093c8a2bea3d2a40b6bc208b143dc644d23c83cc90bb53d6aebc9a79e73c78cf3e3ded1476bdca5f093de78d39bd423693bb00490a3c74e8523b7bb97fbcaf3933b8e09a3bbd0d08093da0d74abdf375d3bccc398fbc40c5233e065103bde45edbbcf132d1bc044db93c04b3e83b8771fd3cca2b3d3dcda23bbd95a7c3bd6d9d25bd0b9959bd8ce255bd39ad6b3dc3f44bbd53e247bd188c3d3cc8326b3c44df2f3dbe3db53c290c69bb816ba23c1cc7d83b8a8b533df9d4b53c2c174b3d82038bbb95332e3d67093e3dc6a4ccbdd2f1f43c67239cbcdff8143cb9ae95bd2a7fc33c8fadc53c931fdebc17241abc091337bc141aa13bef0c213d3910a2bb7bc0ae3c3a8a873b538eb73d30396abdcaea8a3dadea943d12bf77bcdd1ceebba4b5123d7a0942bc588c40bdbf89f83c0e728f3c507930bd2559733d4badff3b87bbde3a72c13f3cbe56c1bdee8800bd1df6f7bcde427cbd2cb6b8bd8254a43df4ac373d761a0f3a0713e23bdffc0cbc0afeb9bd, 0x371a16bd48cd513d44a608bceaf7f53c1ac33f3d0745163dc9dd173dd78423bdaf2c5ebcf5c4b73ca1a2a1bd18f70f3d1e5e733cb2b0b33c9274633c689102bd959e55bdbba764bd574bef3bf120623d25ef2c3d121cb5bb9ae878bd84b18abcd92fa6bc5d5c0dbbfe533fbd85f9e53b7524c83c8c07c03d77ae81bbe72576bcd903673d95c21e3d370238bb3f83eebc7f709cb803d2d33b9d60853bbdd45cbd379a753d5f515cbdae0617bc0b422ebd76e545bc3e84593c3ae2a33dc5a4ee3de72bc13dc292803c8d7121bdade564bdb754923d9cd8e53cd4e507bb4b26aabd19a2983bbd9e0a3b2c5904bc93f2e43c9c17e2bd26146c3cb814e53b76e6913df9ecabbc9144f2bcbc7c28bc1e7e0abe800e703d159c303c47e3353d8490723d4f9732bcecc8d9384500c5bd08a5de3cfb1c503c6cdbcf3da89b9b3c09d3083cec4ec9bd3ab7433dbbed593c27e5653d9421c93c1107dfbc0fecd6bc1168fd3c6842773acbd0a3bc7cc7e43cbf45423d46b7173d64b2a6bc39d3c93ccd68133d3b5d973bbd1b48bd1579c3bdd06ffbb94209433d430a6cbc9a8b903d076b1dbcc863663be26edcbc3a34ba3dd9a6493c98c1843cabaccf3c783135bd4ba4fcbb47789d3b1294edbbf764443c5628cfbc7ace113d846b813d565c683cf10cb1bc18f407bcda68b2bc38620d3dd52d18bcc501ff3c8e353fbc7a7816b84a124cbdb807e4bc015be9bc48c6853df68e303cc174e53dd7a7173de4669abc033c813b2ebfe63ce96c86bbd87c5abdd6d14a3daece27bd1e77203c1dca113c5290e03c001dab3c56c1963b3c46c9bde7f2ffbbdc7f90bdc6b80cbd01e468bd26cd993c3fe6be3cc2efab3c7f1d7dbc5069113ce984ae3c69a6efbdeada44bd9981c43c88feb1bd4f0ca2bb0c02093d802a34bdde811b3ca01949bca3479bbb1ca195bcd94187bca747c2bc20c97b3d058d123db79d043d553e0abbfd7f20bd7d02583cfc28f53b74af163d8dd986bd6e6c83bdc062a73b89723f3d75034cbd0ec0023d76c4993d3ab1673d7db96cbd3b0855bdd419213c6bd0183cfd07a1bcd9ee69ba8b05ccbc614b0cbe1237243d278258bd2f83203d626a1abeab5b24bd3770b03cb181cd3c00e60ebc72256b3d8b5301bd889dcdbcbc95873d7230ca3c0389bcbbcb1fd0bd768e2d3dd7d2c0bb36a7c73b2effc33d6fcd1dbde064c8bc617d853d4dd14dbd0df33f3b2fe6953c50dc443d013626bcdad9ad3bcb36a83d8758a4bcaf065d3d1dc2053d7aed2cbd9670523d0f2004bd1a818ebc5bd3ca3cd7664abd18c6e3bcea9b92bdf111e73cbc3dd33c8eddbe3ce11434bd839ba7bcf5008fbc189194bd0065ca3de52a17bdc00aa1bc4d893d3d04d245bdf1d3bb3c48a2493d0c0e7a3d352c77bc911539bd14d951bd3f3db3bcbd56b93c246ded3cb3e9b63c5eb1ec3cec5523bde27fbabc34bb9c3da93790bb5755c4bc41f57e3d6a46de3c54f7ecbb7c09b7bda08d70bd69e9303d6a29f73c379905bcb50bb13be8e20ebd02d50a3bb2113d3d1068883b0e3e443d64a91ebdc82e6c3b529f55bb7826953b44cf493d3efa7c3c2a82afbbab9b4c3c34e8bfbd374c833d7f1f67bda064ecbae64738bc86b402bd7c9593bd9651133dee98993d488e0e3df122be3a0a6dd6bc80c2eebca5cda8bcea2c1d3dc9d6483da39457bd27f9753d0a7736bd97bb2b3c2b484fbdb33b8dbb1498a3bca319473c334d19bdb67d253caa7a41bc6068dbbc933395bc31a19e3dce26823d6313813ded6f87bd3b389bbdea20f4bcb0ff89bcf7e8f73b1f9bd53de39f51bd1d2a383b4d3dccbc51389cbdf9181fbc7f959fbc5e98d33cabe7413cf36f933da7ba45bd62c33bbd6131a7bb1cd3ccbd810c163c5101e93c3fa12f3c7fc989bd9277aabc1728d3bd655788b989b118bd0294ab3d7e5ce4bb64147d3dd8d0873df7a2773df260a73daee4ccbceab52a3c5fd5b9bcd6ded1bca67c3cbd538c043de373433dc3ac78bdd60bdfbc69a94fbdbdd219bc7332d0bc71ba16bd762d91bdc52a50baf3a56e3c41109d3dde58943c4052b23cafab91bcc84e733d4c9b033de3b595bcdee99e3c381982bdd60509bd2247503d9219abbda6abf9bb08da673dc1ed9b3bdddd2c3dd17e593d2ab326bcf4673a3dce61a2bcf26dbf3cdfceb73b9a88853be74e393dfcce073d7fc9b0bb61f0413bed4c6d3cdfac16bd779416bdf9cb13bd587d343c8453fa3c2f3069bdafaa25bd741f70bbedae1d3dfc7d48bdc3dd8eb997ce9e3dfbe99b3c88e3c6bdb4a69ebbbfd054ba7b8789bc4924d23c30f505bc0e95423df21490bd0039a33c065410bdfee9433d0444ed3cdc4ed13ca88d3e3ddeb0733d180573bb38c88e3d16a9a03cda242d3da694013c1da9ef3c525c283dac1fa9bdf6192d3ceb4e88bdf9ab323d4a3528bd3cf9f4bc0f3132bde9b908bd0a391bbdf7fbaa3c0e4b23bd873440bc98448bbdb03a8e3d7248a3bc287828bde51ca7bcbbd4683d591bd73c1ac2a83c2d87073dedc3e0bc878497bd0029ccbb882f95bc93aa3fbcf9192c3c14da18bd740888bc3fdf0fbd81107e3c7e898e3b0442033d6e00093ca8b9b9bb8d5d303b7298bb3bfab1063b706eb23c237420bd9fc486bb4835243db853b5bdd5e7d2bcbe833e3c359a1d3d246677bd2601543d0ea8033a852d01bd00af003caebf82bd3e16103db62d3abd67f53ebcaa291c3d5542963cf787313d040295bdd7720f3d7b11c53d4d2c25bc7f48db3c2ed6a83c9eac5d3c6af794bdb404c33c3792173c94e821bdfb3fb23d3242d83cefd26c3b6327d73c2899b1bd00701cbda89a223dff746bbd05b6d3bd7ff89fbcb99c4e3a2b6fed3cc65cb43c4965f33c20b0bbbd, NULL, '1234567899', 'sync');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_user_permission`
--

CREATE TABLE `tbl_user_permission` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `group_id` int DEFAULT NULL,
  `subgroup_id` int DEFAULT NULL,
  `context` enum('daily','event') NOT NULL,
  `event_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_user_permission`
--

INSERT INTO `tbl_user_permission` (`id`, `user_id`, `group_id`, `subgroup_id`, `context`, `event_id`) VALUES
(23, 1, 2, NULL, 'daily', NULL),
(33, 18, 2, NULL, 'daily', NULL),
(34, 17, 1, NULL, 'daily', NULL),
(35, 17, 2, NULL, 'daily', NULL),
(36, 17, 1, NULL, 'event', 13);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_attendance_auth_log`
--
ALTER TABLE `tbl_attendance_auth_log`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_terminal_context_event` (`user_id`,`terminal_id`,`attendance_context`,`captured_at`),
  ADD KEY `idx_event_id` (`event_id`),
  ADD KEY `idx_authlog_user` (`user_id`),
  ADD KEY `idx_authlog_terminal` (`terminal_id`),
  ADD KEY `idx_authlog_time` (`captured_at`);

--
-- Indexes for table `tbl_attendance_session`
--
ALTER TABLE `tbl_attendance_session`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_session_user` (`user_id`),
  ADD KEY `idx_session_terminal` (`terminal_id`),
  ADD KEY `idx_session_event` (`event_id`),
  ADD KEY `idx_session_checkin` (`checkin_timestamp`);

--
-- Indexes for table `tbl_attendance_summary`
--
ALTER TABLE `tbl_attendance_summary`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_context_event_date` (`user_id`,`attendance_context`,`event_id`,`attendance_date`),
  ADD KEY `idx_summary_terminal` (`terminal_id`),
  ADD KEY `idx_summary_event` (`event_id`),
  ADD KEY `idx_summary_user` (`user_id`),
  ADD KEY `idx_summary_date` (`attendance_date`),
  ADD KEY `idx_summary_status` (`attendance_status`);

--
-- Indexes for table `tbl_auth_capabilities`
--
ALTER TABLE `tbl_auth_capabilities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `terminal_id` (`terminal_id`);

--
-- Indexes for table `tbl_auth_policy`
--
ALTER TABLE `tbl_auth_policy`
  ADD PRIMARY KEY (`id`),
  ADD KEY `terminal_id` (`terminal_id`);

--
-- Indexes for table `tbl_auth_session`
--
ALTER TABLE `tbl_auth_session`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `terminal_id` (`terminal_id`),
  ADD KEY `tbl_auth_session_ibfk_3` (`event_id`);

--
-- Indexes for table `tbl_auth_session_steps`
--
ALTER TABLE `tbl_auth_session_steps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `session_id` (`session_id`);

--
-- Indexes for table `tbl_event`
--
ALTER TABLE `tbl_event`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_event_time` (`start_datetime`,`end_datetime`),
  ADD KEY `idx_event_created_by` (`created_by`);

--
-- Indexes for table `tbl_event_access_policy`
--
ALTER TABLE `tbl_event_access_policy`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_id` (`event_id`);

--
-- Indexes for table `tbl_event_checkin_checkout_range`
--
ALTER TABLE `tbl_event_checkin_checkout_range`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_event_check_range_event` (`event_id`);

--
-- Indexes for table `tbl_face_buffer`
--
ALTER TABLE `tbl_face_buffer`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_face_buffer_user_id` (`user_id`);

--
-- Indexes for table `tbl_terminal`
--
ALTER TABLE `tbl_terminal`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `tbl_user`
--
ALTER TABLE `tbl_user`
  ADD PRIMARY KEY (`id`),
  ADD KEY `terminal_id` (`terminal_id`);

--
-- Indexes for table `tbl_user_permission`
--
ALTER TABLE `tbl_user_permission`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `event_id` (`event_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_attendance_auth_log`
--
ALTER TABLE `tbl_attendance_auth_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `tbl_attendance_session`
--
ALTER TABLE `tbl_attendance_session`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `tbl_attendance_summary`
--
ALTER TABLE `tbl_attendance_summary`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `tbl_auth_capabilities`
--
ALTER TABLE `tbl_auth_capabilities`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `tbl_auth_session`
--
ALTER TABLE `tbl_auth_session`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `tbl_auth_session_steps`
--
ALTER TABLE `tbl_auth_session_steps`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `tbl_event`
--
ALTER TABLE `tbl_event`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `tbl_event_access_policy`
--
ALTER TABLE `tbl_event_access_policy`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `tbl_event_checkin_checkout_range`
--
ALTER TABLE `tbl_event_checkin_checkout_range`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `tbl_face_buffer`
--
ALTER TABLE `tbl_face_buffer`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `tbl_user_permission`
--
ALTER TABLE `tbl_user_permission`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_attendance_auth_log`
--
ALTER TABLE `tbl_attendance_auth_log`
  ADD CONSTRAINT `fk_authlog_event` FOREIGN KEY (`event_id`) REFERENCES `tbl_event` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_authlog_terminal` FOREIGN KEY (`terminal_id`) REFERENCES `tbl_terminal` (`id`),
  ADD CONSTRAINT `fk_authlog_user` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`);

--
-- Constraints for table `tbl_attendance_session`
--
ALTER TABLE `tbl_attendance_session`
  ADD CONSTRAINT `fk_session_event` FOREIGN KEY (`event_id`) REFERENCES `tbl_event` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_session_terminal` FOREIGN KEY (`terminal_id`) REFERENCES `tbl_terminal` (`id`),
  ADD CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`);

--
-- Constraints for table `tbl_attendance_summary`
--
ALTER TABLE `tbl_attendance_summary`
  ADD CONSTRAINT `fk_summary_event` FOREIGN KEY (`event_id`) REFERENCES `tbl_event` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_summary_terminal` FOREIGN KEY (`terminal_id`) REFERENCES `tbl_terminal` (`id`),
  ADD CONSTRAINT `fk_summary_user` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`);

--
-- Constraints for table `tbl_auth_capabilities`
--
ALTER TABLE `tbl_auth_capabilities`
  ADD CONSTRAINT `tbl_auth_capabilities_ibfk_1` FOREIGN KEY (`terminal_id`) REFERENCES `tbl_terminal` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_auth_policy`
--
ALTER TABLE `tbl_auth_policy`
  ADD CONSTRAINT `tbl_auth_policy_ibfk_1` FOREIGN KEY (`terminal_id`) REFERENCES `tbl_terminal` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_auth_session`
--
ALTER TABLE `tbl_auth_session`
  ADD CONSTRAINT `tbl_auth_session_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`),
  ADD CONSTRAINT `tbl_auth_session_ibfk_2` FOREIGN KEY (`terminal_id`) REFERENCES `tbl_terminal` (`id`),
  ADD CONSTRAINT `tbl_auth_session_ibfk_3` FOREIGN KEY (`event_id`) REFERENCES `tbl_event` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_auth_session_steps`
--
ALTER TABLE `tbl_auth_session_steps`
  ADD CONSTRAINT `tbl_auth_session_steps_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `tbl_auth_session` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_event`
--
ALTER TABLE `tbl_event`
  ADD CONSTRAINT `fk_event_created_by` FOREIGN KEY (`created_by`) REFERENCES `tbl_user` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_event_access_policy`
--
ALTER TABLE `tbl_event_access_policy`
  ADD CONSTRAINT `tbl_event_access_policy_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `tbl_event` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_event_checkin_checkout_range`
--
ALTER TABLE `tbl_event_checkin_checkout_range`
  ADD CONSTRAINT `fk_event_check_range_event` FOREIGN KEY (`event_id`) REFERENCES `tbl_event` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_face_buffer`
--
ALTER TABLE `tbl_face_buffer`
  ADD CONSTRAINT `fk_face_buffer_user_id` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_user`
--
ALTER TABLE `tbl_user`
  ADD CONSTRAINT `tbl_user_ibfk_1` FOREIGN KEY (`terminal_id`) REFERENCES `tbl_terminal` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_user_permission`
--
ALTER TABLE `tbl_user_permission`
  ADD CONSTRAINT `tbl_user_permission_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_user_permission_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `tbl_event` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
