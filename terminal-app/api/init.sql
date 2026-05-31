-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: db:3306
-- Generation Time: May 31, 2026 at 09:01 PM
-- Server version: 8.0.45
-- PHP Version: 8.3.26

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
-- Table structure for table `tbl_auth_capabilities`
--

CREATE TABLE `tbl_auth_capabilities` (
  `id` int NOT NULL,
  `terminal_id` int DEFAULT NULL,
  `auth_type_id` int DEFAULT NULL,
  `auth_step` int DEFAULT NULL,
  `auth_type_name` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_attendance_session`
--
ALTER TABLE `tbl_attendance_session`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `tbl_attendance_summary`
--
ALTER TABLE `tbl_attendance_summary`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_auth_capabilities`
--
ALTER TABLE `tbl_auth_capabilities`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_auth_session`
--
ALTER TABLE `tbl_auth_session`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_auth_session_steps`
--
ALTER TABLE `tbl_auth_session_steps`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_event`
--
ALTER TABLE `tbl_event`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_event_access_policy`
--
ALTER TABLE `tbl_event_access_policy`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_event_checkin_checkout_range`
--
ALTER TABLE `tbl_event_checkin_checkout_range`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_face_buffer`
--
ALTER TABLE `tbl_face_buffer`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_user_permission`
--
ALTER TABLE `tbl_user_permission`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

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
