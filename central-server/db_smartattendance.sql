-- phpMyAdmin SQL Dump
-- version 5.2.1deb3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 14, 2026 at 07:53 AM
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
-- Database: `db_smartattendance`
--

-- --------------------------------------------------------

--
-- Table structure for table `lkup_attendance_status`
--

CREATE TABLE `lkup_attendance_status` (
  `id` int NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lkup_auth_type`
--

CREATE TABLE `lkup_auth_type` (
  `id` int NOT NULL,
  `name` enum('face','fingerprint','card') DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `lkup_auth_type`
--

INSERT INTO `lkup_auth_type` (`id`, `name`) VALUES
(1, 'face'),
(2, 'fingerprint'),
(3, 'card');

-- --------------------------------------------------------

--
-- Table structure for table `lkup_exception`
--

CREATE TABLE `lkup_exception` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lkup_grouptype`
--

CREATE TABLE `lkup_grouptype` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `abbreviation` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `lkup_grouptype`
--

INSERT INTO `lkup_grouptype` (`id`, `name`, `abbreviation`) VALUES
(1, 'Staff', 'STAFF'),
(3, 'Students', 'STU');

-- --------------------------------------------------------

--
-- Table structure for table `lkup_permission`
--

CREATE TABLE `lkup_permission` (
  `id` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `is_staff` tinyint(1) DEFAULT '1',
  `is_student` tinyint(1) DEFAULT '0',
  `status` enum('active','disabled') DEFAULT 'active',
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lkup_role`
--

CREATE TABLE `lkup_role` (
  `id` int NOT NULL,
  `role_name` varchar(100) NOT NULL,
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `lkup_role`
--

INSERT INTO `lkup_role` (`id`, `role_name`, `description`) VALUES
(1, 'admin', 'have all admin privileges');

-- --------------------------------------------------------

--
-- Table structure for table `lkup_role_permission`
--

CREATE TABLE `lkup_role_permission` (
  `id` int NOT NULL,
  `key` varchar(100) NOT NULL,
  `role_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_announcement`
--

CREATE TABLE `tbl_announcement` (
  `id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `status` enum('pending','active','expired') DEFAULT 'active',
  `created_by` int DEFAULT NULL,
  `group_id` int DEFAULT NULL,
  `subgroup_id` int DEFAULT NULL,
  `create_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_announcement_acknowledgement`
--

CREATE TABLE `tbl_announcement_acknowledgement` (
  `id` int NOT NULL,
  `announcement_id` int NOT NULL,
  `user_id` int NOT NULL,
  `acknowledged_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_announcement_group`
--

CREATE TABLE `tbl_announcement_group` (
  `id` int NOT NULL,
  `announcement_id` int NOT NULL,
  `group_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_announcement_subgroup`
--

CREATE TABLE `tbl_announcement_subgroup` (
  `id` int NOT NULL,
  `announcement_id` int NOT NULL,
  `subgroup_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
  `create_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

-- --------------------------------------------------------

--
-- Table structure for table `tbl_auth_session`
--

CREATE TABLE `tbl_auth_session` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `terminal_id` int NOT NULL,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `current_step` int DEFAULT '1',
  `status` enum('in_progress','completed') DEFAULT 'in_progress'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_biometricprofile`
--

CREATE TABLE `tbl_biometricprofile` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `face_template` blob,
  `fingerprint_template` blob,
  `card_serial_code` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_biometricprofile`
--

INSERT INTO `tbl_biometricprofile` (`id`, `user_id`, `face_template`, `fingerprint_template`, `card_serial_code`) VALUES
(6, 1, 0x6b12b93c1a02783c760bfc3c09801abdc8c1f73cd94e393db1b5fb3cee2b8d3b164e223d27c36fbcab8603be5c99b73c131c5bbc62239c3c10ff043dcc1db9bcb878c33b7fb998bd0ba42c3c30815f3dc57ab53c432a14bdf28d013c7468293b8d5e84bc10a231bd6bfbb4bba1c7093dea8343bdc923843ddb21e13b57e049bcc70d9c3db8c1453d19e55c3bed8c04bdfac0903d76019c3d6e25fbbc10e5dc3b505a2a3d454425bcb9cf103d19735ebd1aab17bd95ff99bb3ae99d3d5326923d95440a3d95def93c685099bdb644cdbca5bb30bd0b6e773d9b88953c288357bd482b263db4eca73c48be1f3b4246693caa2ce5bdaabe81bbe0c884bc6172033d56e38f3c7384823b1b133a3dfd3316be43f92b3d442a473dd454203d1ce18b3dafc4b33ba679c13cdd79e8bd5ea5693ceb9a193d859f1d3dd78b843d2ece3dbb91b76ebd4281ff3c8fb73b3d1c6d353c60e0193e7eb508bc7b2b2cbdc997053caa0847bc66d13a3db308ecbb98b85bbbfaa6e6bc20b388bde6e94d3ca8ec353d06b6c4bc889dd2bceb4294bdaae08abd75dc0a3d9eeac73c72ff893d5c72bc3cd582923d7b75b03c981f7e3d60d8ce3d12125a3c0ac58ebcf22575bcef6498bd7b05b5bcc2bfe03c60b839bbad8747bc0b1e973d9584673c5cfb173d43bae4bb97ec14bb18b6be3b95e443bba8254bbc37e687bce648f93c924651bbc3df3ebca7ce92bbd8ac143cd95b863c0d2ba43b1dc4013eaa7bd83b9d0a89bddb748c3dfc08d33d9361283c2d5c113c653ebabac2f616bdbf3b2a3d5e5b2e3c39e40a3c4b23073cbe1c10bdcf4b84bd1cd5fc3ca9349bbde1495ebd6eebc9bcc44be03b97ab87bcb1cc51bb23ebebbcaab6213db2bfd4bd24ab8dbda6e2763bd95e9bbc3d9da4bd4a1113bde1e20ebb22abd939935ffabcbed640bc59965cbd67493d3db8cba4bc8449223c76dc303bba4f85bcf272533d5ffaabbb01b816bd415924bc6a68cabc59d2bebce9cc29bd60a557bd74de853d902dd1bc05e79bbd5a07703dca61b13dbded5d3dc4047fbd735d9bbd28820cbd061d883c006af0bc5877623cfab421bd298d2c3c6d9c993c3ebe1abd85de9d3c4cf53bbdd60004bd7393c8ba2693d0bb81c659bc88838d3da2a71ebd4ca602bb35195d3aed45823cf7e66abd7735a5bd3e37743b8e14f63c5748823de7620f3e7067173cddc2b5bc8e014c3dfbdbef3c6ee8703cc31e83bdafaeb2bcfa73ef3af12a10bd3cd1c03d1f6dd83ccd23f53d3059e1bbed036cbc1b66bd3b757493bdfcef9f3bf45d11bd13ec423ceca34f3de71af1bddac718bc0a4a283deb49e43c1830afbc530c023ce6cb01bd7ee19dbc4bb1d03d04d07abd2bdd89bce172943da53a2bbde41c153d1fc96b3c8f3b80bc51c6793c04acc53c236918bd83bfb7bc1ec2983bb4c408bd4df94a3d1d1d313d62e2b6bcd43b0cbd063aa93d2721a33c243b0ebce787053ddcdae73cf7a08fbdfc6188bcbc52a4bd3a8ee93b79e6033dbe7a58bb7c50eb3a5f396dbd918c5bbb6109f43d1fbdedbc6683783dac8609bde134f0bc6d809b3ccbf2b9bc649f073d686cddbcc9246f3ce4f5133d06de14bd5b45423dc4bce7bb69bd3dbd450b223c57d5d93c94870ebd8f7813bd3491483d74d4fc3cfc8ee83c9ef2e6bb57a933bc379c15bd142e333d5ca54cbd6a28acbd093d43bc23d62a3cc96a34bcec2fca3c65573dbc84cc133d1e1ad93c9d24993a6a01edbce576f7babb9f9fbd4cab443b020c493de3639a3c6abda03dc4fa5abdf49420bc49fea03c89c256bcf2970e3d75730c3d85de0bbd8fe830bd3527dd3c52e396bd4192c3bcef57cdba698531bd613c643c4e213b3dd76f0d3dff7582bd64d481bb47c3eabd8a9c1c3d65c1a23cb128393c71fe82bd6e2b61bd344e88bdba3db83cc5035cbc0a73d03c335dc13c7330503de5151b3ccb75ea3c8a9d153da1898ebc58eb46bd9c3b0ebd3326623d9f9d30bd6f46123d6c49f83b3df79cbdc8a418bd52c96bbd52c328bc1550223d708cce3cdf17c73c1da4acbb6b0c99bc5c5e8c3dd51fc23ce92ac93c86ed663d9cbf283caf4dc23cc874bebb4d1b893d9ad7a73ccbb10e3c0be12f3d81a0d5bd61e6aebc11dc0e3d07d1e6bbf9ff19bd0e2dae3d44dc093b5b5a893d14b4f7bacc0c9abcaac3bfbc6358b9bc6aa23d3b2272ed3c480baf3c39f2c8386d0f563dad10a7bc5b89b7bc9a1deb3c6c4d63ba3ddb0cbc98571fbded2ca2bd9d590ebe4d919b3d2d9c54bd0b1bccbb23a8863d4382783bb75825bc7cd5353a96741a3d59b347bc59b1eabc64d78bbc3689b5bcf42afebc4b2e55bd4f5b68bc19a19b3dffcd003c6c31273ca49c523c3e04823d7630063d2b15753d425bb43ba90fb13c5066ddba24be153da8983fbc0f913abde81e47bc869b84bdafc1da3c5b836ebd19e0f53b25d955bd8fc92e3c301d34bd93454e3cd52f96bd891affbc770db03c9d52173d84969fbcf1cad43a452990bceab6103d90f6de3ce384cb3cd7863f3d986382bcced812bd40bfaf3a4db861bd4dd2fcbb37c5d53c475d19bcac4733bdd025913cc2790f3db05e783d968ea83da4fefd3c2c90e3bc32fbc3bbc9d6e03c6f5a023c779ec13b5776fb3c491d493bf596bf3dbc9cb0bd31b178bc4567a7bcea13053d2a8ababd2f1f2e3d3cbc4e3d8dee71bcd13a3f3b37b1a0bc9b68353da6c526bb31d6bab90a0b113d1dcb4abc11a4a83de8739abd63668d3ceb6c523da79a9bbccd2b073cfa11073d0c1d6dbb4678b23c2f6a553de4c38e3c0baa2c3b63a30c3dccb25a3da1e695bdbd96c8bc6528b8bd9b1d79bd448a69bad255bdbd6b08debd98bf533c2b4d473debbc7fbcd31a6b3ce84d56bcb6edb7bd, NULL, NULL),
(7, 17, 0x99e53fbc8a48413bc1ba663b8ed003bd7c56f53c2954cb3b27feb43c9b08d53c88a9a9bc3c51153d2cb2903caffa3a3b3fb59ebd64341a3db20c5c3c5605263de74385bcca0040bd3f1ead3c4fea8d3c48de623d7da8243d21ecff3b8b9bedbbb9c9a3bcf9a7dbbc622d073d125c8b3d9aee343cc7cb633d440fb5bb7489163c978c6c3d9e4a323d3c1df3bbc8325d3d0bbe62bd63a7233c7514b43dc3fa10bd67dfb7bbb09a9abdd8e48f3b732734bcc407fabc891d42bd1ce24d3cf8557b3c3862fa3c29c75a3d98356dbd21e358bd634f003e5d228a3c59b24d3ded5c1b3d5635c93d02bc3f3c6983623cca1e763d1e3ef8bc350c033dfd591c3ceab3963d8b00723b229a99bdec5ef4bb8cd5a7bd04f1b03d29b71c3b30c00cbe36fd353da81bc8bcfb170a3d8e16acbd5ebe873c802540bcb734083d0db4373cab7601bd113548bd5f9ac13c1f108d3dad97173dd88de33ce33ac23c10c893bd35ae473daae89c3d7e67953ce594313bfd86933c16e7093b4f19803d9068ff3cdb8e3cbc471d13bc2355cb3cbc27ebbdb973003de4cf313d8f06573dcfd7153c0fe9a9ba628da43daa7dafbc71460b3d1c018bbd5722b0bc842aa6bb052f2d3bae0800bd81fba03d37fb3ebc8ffcd43c57bb073c46ea213c59662c3d01928d3be9fe08bdd94f08bc7c27e7bc4c6f8d3df65b8dbcc5ac8a3d6ef6f53c7faeacbd57fb363d2eb5cbbbb7b3683c6002d73a34387dbd92c1aa3dd83701bd01bd2ebd2d5fb53c17d0653d8fac78ba706780bcdc5ece3c062b0b3cba75b13d031c413c749aa03a62f8613d77662ebda9e9a2bddbd81e3c724f80bd77d192bc545150bd2b43143db0ab2b3b1679ab3c04d38f3d9bf934bdd94cf73cfe86bdbd4f4986bd0d2e7a3c4b1a80bd32889ebc796489bb5a7779bdf14a653db171983b291a673d06805ab89d93b8bc4f619c3cb22eed3c8808823d4f1230bd82abacbcd5dde23c9763233b32a05bbd4002c73cdc6a6ebdfab7c13c402695bdb7fb303db31a2fbc28c86fbcadab5d3d5f0d043dfba407bd00a65bbd9bdf103d69e374bc71ae333dfb10e73c91108cbd0d333ebd2a3dd73cd8faed3c35f5743d71cefdbc041463bda2f91fbcb6ece23d760adc3c70335c3dede86c3b8cad2d3bbdeebebc86e734bded715abdd9109dbd32a3d13ca32e083d4148723de256d63d4c8dff3cbac88e3c5a9761bcdf8a03bb922ee83c7c722fbc448a743b612a6bbd1780bd3c7778acbcffd983bdcc43a73ce90419bdec9b79bddc4dc53c0e9be53c6737853b45829d3ce4779ebc681de13a732c44bb062d6f3df8b88fbc2d4fcd3ba08c993c3830813c0f466fbdbd1eedbce826823dcccef43cbf11f93cbf810c3d406bee3c3ab730bd3ed19d3cfad97cbdd8fd133c5e5ba1bcb3eedf3c568fd6bc6d16af3c3d4e5d3da7c8cb3d0a77d5bc839631bba329adbd46aef33cfa658bbca6366d3dde0dd3bbe0e6273dacb091bc178538bd87e917bd6de6bdbc6815913cf2ac183d4eb1e2bcddf30abb0bb93dbdf20224bd514accbcf64aa03d7af34bbcee060cbc8dd5713c5c73993df73abd3a8e49563d89c218bd28bf80bb3b20bfbcce5d5cbaaf1c71bdaf5955bd0255b3bc68f406bdf8f924bde7c883bd3737083d25c79a3da1781e3da3b7f6bc160bba3c2b90c33c3edc42bc45e77b3bf8dd32bda5336c3dedbdaebd3c9c85bdb9c2413d9db68b3c135c9a3c0f83033d65ddbb3ac73a3abd3c6fbd3a39ed43bde23745bc100f933dc67049bc7340863d4b01dbbbb5cb5f3c0b7d85bd4e11423ddd7f183cc3689b3d9e7218bd61e9893d0b521c3da76e8ebce16c533dc3aa39bc86e9153bc0e94dbd21cb30bdb36ca83c75f7873b10527d3d5ea51abe7caef1bc0aa5073d0dbeec3c272949bdcb3a2e3cd4e8c63ba05a2dbd10f815bd1a62703c0f0ea7bde412b83d3faf3f3df763933c38a9b23cc1002ebce11930bcccb156bd63ac63bda03ddebc4284963d21e1c63c4044fa3bcd57b53c9125d8bc72f354bdf3e564bd3ae296bb7bd48bbd354ef43cde80aa3c5c0c433c4ef696bdbf0f9d3ca3fd2d3c74662c3c24222dbb1e0d7c3c3561683db6f429bd2803c03c9aa576bd52512ebda53256bc536a0bbde1dd1bbd6e8f13bbc4d7d73c09508cbc01b1a1bcdd5a8abddba113bdf5347ebc1ae50f3d098f843a44212fbd41098c3cd1c5c0bdcd790739eea8abbd6a3c0b3b1c9fa03c64bd8e3c1c9b4abd31ad4f3d48ce37bcbe9c10bdeed9b93d09368f3c70ad29bd4ca102bc7619973d8c604abbd7f485bcb07d4ebc579d873c52f2fc3c04f0043db677f8b9f2318abd95278d3ddc95c1bc8c43273c6e3d4bbc8ccf333d850ba23cf1877f3d1f079b3caacf66378839cbbdf8d7de3cce798d3c415b903df994b9bcd7d0a4bd61c5593d34e544bd292e1a3db87be2383d98dbbdf02f933d2a99b2bdde33503cb119e5bc4229f63bfb08e33cb78bccbd24123e3d6fe158bcfb560fbceaf9bbbb35ccdebc6e704c3c33faf03c6e64353d7b6affbcc9fef1bda8ad01bdc695fabc2106d43c4b92d83c7e1079bd2821c1bbf1561dbd74473f3d5da3063d3bc387bc3edacebb2375f63cb8f79b3dac41243b260a6abc7141693d6ce4ebbc14d0933bcec8913d4d04d6bd06d939bd6b8b41bd2a21c43c7bc851bda8b92f3df9a296bd85af32bd7f19143c21bbc1bdc98b30bd2b3ff4bcacfb85bcd1855c3cbd33be3a7de0e03ca241de3cde4007bd3792813d831ef6bcab612cbd8385abb635aa6bbcbe7918be32d19d3be562b43dbf9b683c6b5becbcfba87abc6a46593df8258dbc51afe7bba170e83caead84bda43b063d04f96b3c6f868e3cea6c513b9722f4bbfb15fb3cdac8813d46490b3d, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_branch`
--

CREATE TABLE `tbl_branch` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `location` text,
  `description` text,
  `status` enum('active','inactive') DEFAULT 'active',
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_branch`
--

INSERT INTO `tbl_branch` (`id`, `name`, `location`, `description`, `status`, `date_created`) VALUES
(4, 'Bamenda', 'Up Station', 'Bamenda branch', 'active', '2026-03-26 18:03:23'),
(5, 'Limbe', 'Half Mile', 'Limbe branch', 'active', '2026-03-26 19:11:00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_branch_admins`
--

CREATE TABLE `tbl_branch_admins` (
  `user_id` int NOT NULL,
  `branch_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_branch_admins`
--

INSERT INTO `tbl_branch_admins` (`user_id`, `branch_id`) VALUES
(1, 4),
(17, 4),
(17, 5);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_class`
--

CREATE TABLE `tbl_class` (
  `id` int NOT NULL,
  `class_name` varchar(100) NOT NULL,
  `description` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_class`
--

INSERT INTO `tbl_class` (`id`, `class_name`, `description`) VALUES
(1, 'Form 1A', 'form 1a class');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_event`
--

CREATE TABLE `tbl_event` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `group_id` int DEFAULT NULL,
  `subgroup_id` int DEFAULT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `affects_attendance` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `handshake` enum('1','2') DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

-- --------------------------------------------------------

--
-- Table structure for table `tbl_exception`
--

CREATE TABLE `tbl_exception` (
  `id` int NOT NULL,
  `exception_type_id` int NOT NULL,
  `description` text,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_by` int DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_group`
--

CREATE TABLE `tbl_group` (
  `id` int NOT NULL,
  `branch_id` int DEFAULT NULL,
  `grouptype_id` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expected_weekly_hours` int DEFAULT '40',
  `absence_threshold` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_group`
--

INSERT INTO `tbl_group` (`id`, `branch_id`, `grouptype_id`, `name`, `date_created`, `expected_weekly_hours`, `absence_threshold`) VALUES
(1, 4, 1, 'Afternoon Shift Beta', '2026-03-27 14:54:49', 35, 3),
(2, 4, 3, 'Engineering Group', '2026-03-27 15:03:41', 40, 0);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_group_member`
--

CREATE TABLE `tbl_group_member` (
  `group_id` int NOT NULL,
  `user_id` int NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_group_member`
--

INSERT INTO `tbl_group_member` (`group_id`, `user_id`, `joined_at`) VALUES
(1, 17, '2026-03-27 16:29:42'),
(2, 1, '2026-03-27 16:29:42'),
(2, 17, '2026-03-27 15:03:41');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_group_supervisor`
--

CREATE TABLE `tbl_group_supervisor` (
  `group_id` int NOT NULL,
  `user_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_group_supervisor`
--

INSERT INTO `tbl_group_supervisor` (`group_id`, `user_id`) VALUES
(1, 1),
(2, 1),
(1, 17);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_logs`
--

CREATE TABLE `tbl_logs` (
  `id` int NOT NULL,
  `category` varchar(200) DEFAULT NULL,
  `description` text,
  `user_id` int DEFAULT NULL,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_permission`
--

CREATE TABLE `tbl_permission` (
  `id` int NOT NULL,
  `permissiontype_id` int NOT NULL,
  `user_id` int NOT NULL,
  `initiatedby` int DEFAULT NULL,
  `reason` text,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `additional_proof` varchar(100) DEFAULT NULL,
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_permission_approval`
--

CREATE TABLE `tbl_permission_approval` (
  `id` int NOT NULL,
  `permission_id` int NOT NULL,
  `approver_id` int DEFAULT NULL,
  `remark` text,
  `date_approved` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_refreshtokens`
--

CREATE TABLE `tbl_refreshtokens` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `token_hash` varchar(1025) NOT NULL,
  `revoked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NOT NULL,
  `revoked_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_refreshtokens`
--

INSERT INTO `tbl_refreshtokens` (`id`, `user_id`, `token_hash`, `revoked`, `created_at`, `expires_at`, `revoked_at`) VALUES
(50, 17, '$2y$10$AQh15YDrZoDVay34qNWhYOLSyMHEdRgJQb1fBbmT9CVv54463.6cq', 1, '2026-03-02 08:24:38', '2026-04-01 08:24:38', '2026-03-02 08:25:50'),
(51, 17, '$2y$10$z/brxjggaKmSe/SauIEYKOkcE5UlY7Nr5kns9NlEd29w3In5CIgPW', 1, '2026-03-02 08:25:50', '2026-04-01 08:25:50', '2026-03-02 08:26:56'),
(52, 17, '$2y$10$Q0J0KuBESNmNaSbeEf4La.pyjBQNQKpzaaCy3GxFZXxoN0ceijhva', 1, '2026-03-02 08:27:51', '2026-04-01 08:27:51', '2026-03-02 09:24:15'),
(53, 17, '$2y$10$98Tj0P53SlvhSwRKxGIZAOmIJHc.n6nmgaZxhDX46/DMeTDxWztRm', 1, '2026-03-02 09:24:15', '2026-04-01 09:24:15', '2026-03-02 09:36:35'),
(54, 17, '$2y$10$AIRw5ziEvwPz9Pex6gZpq.CxDUzdIcYSnGlkO1xpxTK2KVFRNRZYq', 1, '2026-03-02 09:36:35', '2026-04-01 09:36:35', '2026-03-02 13:08:12'),
(55, 17, '$2y$10$OcZO7Kgpb1QbqbSzjfh3AubQidsgIa13ucP3OKMGUmeZnYrGmnrNG', 1, '2026-03-02 13:08:12', '2026-04-01 13:08:12', '2026-03-02 13:08:44'),
(56, 17, '$2y$10$1y2ypUJ7riDhOrl6AztNJesiCKSYCmlg4xd4CvKDwGxXfUWvaRCr2', 1, '2026-03-02 13:08:44', '2026-04-01 13:08:44', '2026-03-02 13:50:20'),
(57, 17, '$2y$10$VLEZouvYVbzrKvIZRCyFI.4AKNmUo8dExAkQMjn4soKYQgy7zQDau', 0, '2026-03-02 13:50:20', '2026-04-01 13:50:20', NULL),
(58, 17, '$2y$10$lcLv8iMySS9bAhIMNJ6kWequeWjUdn8E6pqPagFH3DCeFDDFhCjoq', 0, '2026-03-26 19:04:12', '2026-04-25 19:04:12', NULL),
(59, 17, '$2y$10$aDl45w7yzhjBN4Le1i2XLOzMRK6jnexr4EL4Fe2OCNG5lBmcZD5IS', 0, '2026-03-26 19:08:59', '2026-04-25 19:08:59', NULL),
(60, 17, '$2y$10$6GC2V/w4cq3lMdv9LKzex.n56w8s7U7zZoU/wG8YMnUEforXQelbG', 0, '2026-04-13 10:28:50', '2026-05-13 10:28:50', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_staff`
--

CREATE TABLE `tbl_staff` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `role_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_staff`
--

INSERT INTO `tbl_staff` (`id`, `user_id`, `role_id`) VALUES
(2, 17, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_student`
--

CREATE TABLE `tbl_student` (
  `id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `regno` varchar(100) NOT NULL,
  `class_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_student`
--

INSERT INTO `tbl_student` (`id`, `user_id`, `regno`, `class_id`) VALUES
(1, 1, 'STU-2024-001', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_subgroup`
--

CREATE TABLE `tbl_subgroup` (
  `id` int NOT NULL,
  `group_id` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `absence_threshold` int NOT NULL,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_subgroup_member`
--

CREATE TABLE `tbl_subgroup_member` (
  `subgroup_id` int NOT NULL,
  `user_id` int NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_terminal`
--

CREATE TABLE `tbl_terminal` (
  `id` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `activation_code` varchar(200) NOT NULL,
  `branch_id` int NOT NULL,
  `status` enum('pending','active','revoked') DEFAULT 'pending',
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_terminal`
--

INSERT INTO `tbl_terminal` (`id`, `name`, `slug`, `activation_code`, `branch_id`, `status`, `date_created`) VALUES
(2, 'Updated Entrance Gate', 'updated-entrance-gate', '$2y$10$V6.jLwdbdOx98M8iXrkLVOuFf5H/8.gAjXJWWGoG8qnhux0TBmUPC', 4, 'pending', '2026-03-27 17:49:38'),
(6, 'Updated Entrance Kiosk', 'updated-entrance-kiosk', '$2y$10$pyXW59FzAkQ8sqAYfVoVj..JEyk3wUCWGaF3e1Ln7l7ENFv2JaJW6', 4, 'active', '2026-03-27 18:59:11'),
(9, 'Main Entrance Terminal', 'main-entrance-01', '$2y$10$Jr27TrKgi33BXN35YqG7EeZtvGcxcGSi4Ap7oFoNFgq3GfCihn2Cu', 4, 'active', '2026-04-13 09:55:00');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_terminal_access_policy`
--

CREATE TABLE `tbl_terminal_access_policy` (
  `id` int NOT NULL,
  `terminal_id` int NOT NULL,
  `group_id` int DEFAULT NULL,
  `subgroup_id` int DEFAULT NULL,
  `auth_type_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_terminal_access_policy`
--

INSERT INTO `tbl_terminal_access_policy` (`id`, `terminal_id`, `group_id`, `subgroup_id`, `auth_type_id`) VALUES
(3, 2, 2, NULL, 1),
(5, 6, 2, NULL, 1),
(6, 6, 2, NULL, 3),
(11, 9, 2, NULL, 1),
(12, 9, 2, NULL, 3);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_terminal_auth_capability`
--

CREATE TABLE `tbl_terminal_auth_capability` (
  `terminal_id` int NOT NULL,
  `auth_type_id` int NOT NULL,
  `auth_step` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_terminal_auth_capability`
--

INSERT INTO `tbl_terminal_auth_capability` (`terminal_id`, `auth_type_id`, `auth_step`) VALUES
(2, 1, 1),
(6, 1, 1),
(6, 3, 2),
(9, 1, 1),
(9, 3, 2);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_user`
--

CREATE TABLE `tbl_user` (
  `id` int NOT NULL,
  `class_id` int DEFAULT NULL,
  `fname` varchar(100) NOT NULL,
  `lname` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `gender` enum('male','female') NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `user_type` enum('student','staff') NOT NULL,
  `status` enum('active','inactive','dismissed') DEFAULT 'active',
  `biometric_enrollment_status` enum('pending','completed') DEFAULT 'pending',
  `create_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `tbl_user`
--

INSERT INTO `tbl_user` (`id`, `class_id`, `fname`, `lname`, `email`, `gender`, `username`, `password_hash`, `user_type`, `status`, `biometric_enrollment_status`, `create_at`, `updated_at`) VALUES
(1, 1, 'John', 'Doe', 'johndoe@student.com', 'male', NULL, NULL, 'student', 'active', 'pending', '2026-02-25 19:17:22', '2026-02-25 19:17:22'),
(17, NULL, 'ichami', 'brandon', 'brandonichami@gmail.com', 'male', 'ichami', '$2a$12$TVYNQOQncXFV5gTnq2lGoO77.7j8hQsODYhMgHZ2kXJ2ragG43Jze', 'staff', 'active', 'pending', '2026-02-26 22:09:11', '2026-02-26 22:09:11');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `lkup_attendance_status`
--
ALTER TABLE `lkup_attendance_status`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lkup_auth_type`
--
ALTER TABLE `lkup_auth_type`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lkup_exception`
--
ALTER TABLE `lkup_exception`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lkup_grouptype`
--
ALTER TABLE `lkup_grouptype`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `lkup_permission`
--
ALTER TABLE `lkup_permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `lkup_role`
--
ALTER TABLE `lkup_role`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_name` (`role_name`);

--
-- Indexes for table `lkup_role_permission`
--
ALTER TABLE `lkup_role_permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key` (`key`),
  ADD KEY `idx_role_permission_role` (`role_id`);

--
-- Indexes for table `tbl_announcement`
--
ALTER TABLE `tbl_announcement`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_announcement_status` (`status`),
  ADD KEY `idx_announcement_group` (`group_id`),
  ADD KEY `idx_announcement_subgroup` (`subgroup_id`),
  ADD KEY `idx_announcement_time` (`start_datetime`,`end_datetime`);

--
-- Indexes for table `tbl_announcement_acknowledgement`
--
ALTER TABLE `tbl_announcement_acknowledgement`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `announcement_id` (`announcement_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tbl_announcement_group`
--
ALTER TABLE `tbl_announcement_group`
  ADD PRIMARY KEY (`id`),
  ADD KEY `announcement_id` (`announcement_id`),
  ADD KEY `group_id` (`group_id`);

--
-- Indexes for table `tbl_announcement_subgroup`
--
ALTER TABLE `tbl_announcement_subgroup`
  ADD PRIMARY KEY (`id`),
  ADD KEY `announcement_id` (`announcement_id`),
  ADD KEY `subgroup_id` (`subgroup_id`);

--
-- Indexes for table `tbl_attendance_auth_log`
--
ALTER TABLE `tbl_attendance_auth_log`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`,`terminal_id`,`attendance_context`,`captured_at`) USING BTREE,
  ADD KEY `event_id` (`event_id`),
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
  ADD UNIQUE KEY `user_id` (`user_id`,`attendance_context`,`event_id`,`attendance_date`),
  ADD KEY `terminal_id` (`terminal_id`),
  ADD KEY `event_id` (`event_id`),
  ADD KEY `idx_summary_user` (`user_id`),
  ADD KEY `idx_summary_date` (`attendance_date`),
  ADD KEY `idx_summary_status` (`attendance_status`);

--
-- Indexes for table `tbl_auth_session`
--
ALTER TABLE `tbl_auth_session`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `terminal_id` (`terminal_id`);

--
-- Indexes for table `tbl_biometricprofile`
--
ALTER TABLE `tbl_biometricprofile`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `card_serial_code` (`card_serial_code`);

--
-- Indexes for table `tbl_branch`
--
ALTER TABLE `tbl_branch`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tbl_branch_admins`
--
ALTER TABLE `tbl_branch_admins`
  ADD PRIMARY KEY (`user_id`,`branch_id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `tbl_class`
--
ALTER TABLE `tbl_class`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `class_name` (`class_name`);

--
-- Indexes for table `tbl_event`
--
ALTER TABLE `tbl_event`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_event_group` (`group_id`),
  ADD KEY `idx_event_subgroup` (`subgroup_id`),
  ADD KEY `idx_event_time` (`start_datetime`,`end_datetime`),
  ADD KEY `idx_event_created_by` (`created_by`);

--
-- Indexes for table `tbl_event_checkin_checkout_range`
--
ALTER TABLE `tbl_event_checkin_checkout_range`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_event_check_range_event` (`event_id`);

--
-- Indexes for table `tbl_exception`
--
ALTER TABLE `tbl_exception`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_exception_type` (`exception_type_id`),
  ADD KEY `idx_exception_date_range` (`start_date`,`end_date`);

--
-- Indexes for table `tbl_group`
--
ALTER TABLE `tbl_group`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `branch_id` (`branch_id`,`name`),
  ADD KEY `idx_group_branch` (`branch_id`),
  ADD KEY `idx_group_type` (`grouptype_id`);

--
-- Indexes for table `tbl_group_member`
--
ALTER TABLE `tbl_group_member`
  ADD PRIMARY KEY (`group_id`,`user_id`),
  ADD KEY `idx_group_member_user` (`user_id`);

--
-- Indexes for table `tbl_group_supervisor`
--
ALTER TABLE `tbl_group_supervisor`
  ADD PRIMARY KEY (`group_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `tbl_logs`
--
ALTER TABLE `tbl_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_logs_user` (`user_id`),
  ADD KEY `idx_logs_category` (`category`),
  ADD KEY `idx_logs_time` (`date_created`);

--
-- Indexes for table `tbl_permission`
--
ALTER TABLE `tbl_permission`
  ADD PRIMARY KEY (`id`),
  ADD KEY `initiatedby` (`initiatedby`),
  ADD KEY `idx_permission_user` (`user_id`),
  ADD KEY `idx_permission_type` (`permissiontype_id`),
  ADD KEY `idx_permission_status` (`status`),
  ADD KEY `idx_permission_date_range` (`start_date`,`end_date`);

--
-- Indexes for table `tbl_permission_approval`
--
ALTER TABLE `tbl_permission_approval`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_permission_approval_permission` (`permission_id`),
  ADD KEY `idx_permission_approval_approver` (`approver_id`);

--
-- Indexes for table `tbl_refreshtokens`
--
ALTER TABLE `tbl_refreshtokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_token_userid` (`user_id`);

--
-- Indexes for table `tbl_staff`
--
ALTER TABLE `tbl_staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_staff_role` (`role_id`);

--
-- Indexes for table `tbl_student`
--
ALTER TABLE `tbl_student`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `regno` (`regno`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_student_class` (`class_id`);

--
-- Indexes for table `tbl_subgroup`
--
ALTER TABLE `tbl_subgroup`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `group_id` (`group_id`,`name`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_subgroup_group` (`group_id`);

--
-- Indexes for table `tbl_subgroup_member`
--
ALTER TABLE `tbl_subgroup_member`
  ADD PRIMARY KEY (`subgroup_id`,`user_id`),
  ADD KEY `idx_subgroup_member_user` (`user_id`);

--
-- Indexes for table `tbl_terminal`
--
ALTER TABLE `tbl_terminal`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_terminal_branch` (`branch_id`);

--
-- Indexes for table `tbl_terminal_access_policy`
--
ALTER TABLE `tbl_terminal_access_policy`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_terminal_scope_step` (`terminal_id`,`group_id`,`subgroup_id`),
  ADD UNIQUE KEY `uq_terminal_scope_auth` (`terminal_id`,`group_id`,`subgroup_id`,`auth_type_id`),
  ADD KEY `fk_policy_group` (`group_id`),
  ADD KEY `fk_policy_subgroup` (`subgroup_id`),
  ADD KEY `fk_policy_auth` (`auth_type_id`);

--
-- Indexes for table `tbl_terminal_auth_capability`
--
ALTER TABLE `tbl_terminal_auth_capability`
  ADD PRIMARY KEY (`terminal_id`,`auth_type_id`),
  ADD UNIQUE KEY `unique_terminal_step` (`terminal_id`,`auth_step`),
  ADD KEY `auth_type_id` (`auth_type_id`);

--
-- Indexes for table `tbl_user`
--
ALTER TABLE `tbl_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_user_type` (`user_type`),
  ADD KEY `idx_user_status` (`status`),
  ADD KEY `idx_user_class` (`class_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `lkup_attendance_status`
--
ALTER TABLE `lkup_attendance_status`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lkup_auth_type`
--
ALTER TABLE `lkup_auth_type`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `lkup_exception`
--
ALTER TABLE `lkup_exception`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lkup_grouptype`
--
ALTER TABLE `lkup_grouptype`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `lkup_permission`
--
ALTER TABLE `lkup_permission`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lkup_role`
--
ALTER TABLE `lkup_role`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `lkup_role_permission`
--
ALTER TABLE `lkup_role_permission`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_announcement`
--
ALTER TABLE `tbl_announcement`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_announcement_acknowledgement`
--
ALTER TABLE `tbl_announcement_acknowledgement`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_announcement_group`
--
ALTER TABLE `tbl_announcement_group`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_announcement_subgroup`
--
ALTER TABLE `tbl_announcement_subgroup`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_attendance_auth_log`
--
ALTER TABLE `tbl_attendance_auth_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_attendance_session`
--
ALTER TABLE `tbl_attendance_session`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_attendance_summary`
--
ALTER TABLE `tbl_attendance_summary`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_auth_session`
--
ALTER TABLE `tbl_auth_session`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_biometricprofile`
--
ALTER TABLE `tbl_biometricprofile`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `tbl_branch`
--
ALTER TABLE `tbl_branch`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `tbl_class`
--
ALTER TABLE `tbl_class`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_event`
--
ALTER TABLE `tbl_event`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_event_checkin_checkout_range`
--
ALTER TABLE `tbl_event_checkin_checkout_range`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_exception`
--
ALTER TABLE `tbl_exception`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_group`
--
ALTER TABLE `tbl_group`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_logs`
--
ALTER TABLE `tbl_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_permission`
--
ALTER TABLE `tbl_permission`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_permission_approval`
--
ALTER TABLE `tbl_permission_approval`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_refreshtokens`
--
ALTER TABLE `tbl_refreshtokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `tbl_staff`
--
ALTER TABLE `tbl_staff`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbl_student`
--
ALTER TABLE `tbl_student`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `tbl_subgroup`
--
ALTER TABLE `tbl_subgroup`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_terminal`
--
ALTER TABLE `tbl_terminal`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `tbl_terminal_access_policy`
--
ALTER TABLE `tbl_terminal_access_policy`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `tbl_user`
--
ALTER TABLE `tbl_user`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `lkup_role_permission`
--
ALTER TABLE `lkup_role_permission`
  ADD CONSTRAINT `lkup_role_permission_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `lkup_role` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_announcement`
--
ALTER TABLE `tbl_announcement`
  ADD CONSTRAINT `tbl_announcement_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `tbl_user` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tbl_announcement_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `tbl_group` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_announcement_ibfk_3` FOREIGN KEY (`subgroup_id`) REFERENCES `tbl_subgroup` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_announcement_acknowledgement`
--
ALTER TABLE `tbl_announcement_acknowledgement`
  ADD CONSTRAINT `tbl_announcement_acknowledgement_ibfk_1` FOREIGN KEY (`announcement_id`) REFERENCES `tbl_announcement` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_announcement_acknowledgement_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_announcement_group`
--
ALTER TABLE `tbl_announcement_group`
  ADD CONSTRAINT `tbl_announcement_group_ibfk_1` FOREIGN KEY (`announcement_id`) REFERENCES `tbl_announcement` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_announcement_group_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `tbl_group` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_announcement_subgroup`
--
ALTER TABLE `tbl_announcement_subgroup`
  ADD CONSTRAINT `tbl_announcement_subgroup_ibfk_1` FOREIGN KEY (`announcement_id`) REFERENCES `tbl_announcement` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_announcement_subgroup_ibfk_2` FOREIGN KEY (`subgroup_id`) REFERENCES `tbl_subgroup` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_attendance_auth_log`
--
ALTER TABLE `tbl_attendance_auth_log`
  ADD CONSTRAINT `tbl_attendance_auth_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`),
  ADD CONSTRAINT `tbl_attendance_auth_log_ibfk_2` FOREIGN KEY (`terminal_id`) REFERENCES `tbl_terminal` (`id`),
  ADD CONSTRAINT `tbl_attendance_auth_log_ibfk_3` FOREIGN KEY (`event_id`) REFERENCES `tbl_event` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_attendance_session`
--
ALTER TABLE `tbl_attendance_session`
  ADD CONSTRAINT `tbl_attendance_session_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`),
  ADD CONSTRAINT `tbl_attendance_session_ibfk_2` FOREIGN KEY (`terminal_id`) REFERENCES `tbl_terminal` (`id`),
  ADD CONSTRAINT `tbl_attendance_session_ibfk_3` FOREIGN KEY (`event_id`) REFERENCES `tbl_event` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_attendance_summary`
--
ALTER TABLE `tbl_attendance_summary`
  ADD CONSTRAINT `tbl_attendance_summary_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`),
  ADD CONSTRAINT `tbl_attendance_summary_ibfk_2` FOREIGN KEY (`terminal_id`) REFERENCES `tbl_terminal` (`id`),
  ADD CONSTRAINT `tbl_attendance_summary_ibfk_3` FOREIGN KEY (`event_id`) REFERENCES `tbl_event` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_auth_session`
--
ALTER TABLE `tbl_auth_session`
  ADD CONSTRAINT `tbl_auth_session_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`),
  ADD CONSTRAINT `tbl_auth_session_ibfk_2` FOREIGN KEY (`terminal_id`) REFERENCES `tbl_terminal` (`id`);

--
-- Constraints for table `tbl_biometricprofile`
--
ALTER TABLE `tbl_biometricprofile`
  ADD CONSTRAINT `tbl_biometricprofile_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_branch_admins`
--
ALTER TABLE `tbl_branch_admins`
  ADD CONSTRAINT `tbl_branch_admins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_branch_admins_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `tbl_branch` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_event`
--
ALTER TABLE `tbl_event`
  ADD CONSTRAINT `tbl_event_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `tbl_group` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tbl_event_ibfk_2` FOREIGN KEY (`subgroup_id`) REFERENCES `tbl_subgroup` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tbl_event_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `tbl_user` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_event_checkin_checkout_range`
--
ALTER TABLE `tbl_event_checkin_checkout_range`
  ADD CONSTRAINT `tbl_event_checkin_checkout_range_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `tbl_event` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_exception`
--
ALTER TABLE `tbl_exception`
  ADD CONSTRAINT `tbl_exception_ibfk_1` FOREIGN KEY (`exception_type_id`) REFERENCES `lkup_exception` (`id`),
  ADD CONSTRAINT `tbl_exception_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `tbl_user` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_group`
--
ALTER TABLE `tbl_group`
  ADD CONSTRAINT `tbl_group_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `tbl_branch` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `tbl_group_ibfk_2` FOREIGN KEY (`grouptype_id`) REFERENCES `lkup_grouptype` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_group_member`
--
ALTER TABLE `tbl_group_member`
  ADD CONSTRAINT `tbl_group_member_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `tbl_group` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_group_member_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_group_supervisor`
--
ALTER TABLE `tbl_group_supervisor`
  ADD CONSTRAINT `tbl_group_supervisor_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `tbl_group` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_group_supervisor_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_logs`
--
ALTER TABLE `tbl_logs`
  ADD CONSTRAINT `tbl_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_permission`
--
ALTER TABLE `tbl_permission`
  ADD CONSTRAINT `tbl_permission_ibfk_1` FOREIGN KEY (`permissiontype_id`) REFERENCES `lkup_permission` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `tbl_permission_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_permission_ibfk_3` FOREIGN KEY (`initiatedby`) REFERENCES `tbl_user` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_permission_approval`
--
ALTER TABLE `tbl_permission_approval`
  ADD CONSTRAINT `tbl_permission_approval_ibfk_1` FOREIGN KEY (`permission_id`) REFERENCES `tbl_permission` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_permission_approval_ibfk_2` FOREIGN KEY (`approver_id`) REFERENCES `tbl_user` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_refreshtokens`
--
ALTER TABLE `tbl_refreshtokens`
  ADD CONSTRAINT `fk_token_userid` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `tbl_staff`
--
ALTER TABLE `tbl_staff`
  ADD CONSTRAINT `tbl_staff_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_staff_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `lkup_role` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_student`
--
ALTER TABLE `tbl_student`
  ADD CONSTRAINT `tbl_student_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_student_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `tbl_class` (`id`);

--
-- Constraints for table `tbl_subgroup`
--
ALTER TABLE `tbl_subgroup`
  ADD CONSTRAINT `tbl_subgroup_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `tbl_group` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_subgroup_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `tbl_user` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_subgroup_member`
--
ALTER TABLE `tbl_subgroup_member`
  ADD CONSTRAINT `tbl_subgroup_member_ibfk_1` FOREIGN KEY (`subgroup_id`) REFERENCES `tbl_subgroup` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_subgroup_member_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_terminal`
--
ALTER TABLE `tbl_terminal`
  ADD CONSTRAINT `tbl_terminal_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `tbl_branch` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

--
-- Constraints for table `tbl_terminal_access_policy`
--
ALTER TABLE `tbl_terminal_access_policy`
  ADD CONSTRAINT `fk_policy_auth` FOREIGN KEY (`auth_type_id`) REFERENCES `lkup_auth_type` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_policy_group` FOREIGN KEY (`group_id`) REFERENCES `tbl_group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_policy_subgroup` FOREIGN KEY (`subgroup_id`) REFERENCES `tbl_subgroup` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_policy_terminal` FOREIGN KEY (`terminal_id`) REFERENCES `tbl_terminal` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tbl_terminal_auth_capability`
--
ALTER TABLE `tbl_terminal_auth_capability`
  ADD CONSTRAINT `tbl_terminal_auth_capability_ibfk_1` FOREIGN KEY (`terminal_id`) REFERENCES `tbl_terminal` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_terminal_auth_capability_ibfk_2` FOREIGN KEY (`auth_type_id`) REFERENCES `lkup_auth_type` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_user`
--
ALTER TABLE `tbl_user`
  ADD CONSTRAINT `tbl_user_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `tbl_class` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
