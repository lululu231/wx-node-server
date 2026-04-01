CREATE DATABASE IF NOT EXISTS interest_app CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE interest_app;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- user（不变，作为基准）
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `user_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `open_id` VARCHAR(255) DEFAULT NULL,
  `nick_name` VARCHAR(255) DEFAULT NULL,
  `created_time` DATETIME DEFAULT NULL,
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `student_id` INT DEFAULT NULL,
  `gender` ENUM('male','female','unknown') DEFAULT 'unknown',
  `phone_number` VARCHAR(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- community
-- ----------------------------
DROP TABLE IF EXISTS `community`;
CREATE TABLE `community` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `community_name` VARCHAR(255) NOT NULL,
  `avatar_url` VARCHAR(255),
  `description` TEXT,
  `proof_url` VARCHAR(255) NOT NULL,
  `status` ENUM('pending','approved','rejected') DEFAULT 'pending',
  `creator_id` VARCHAR(36) NOT NULL,
  `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- ✅ 唯一索引
  UNIQUE KEY `unique_community_name` (`community_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- community_comment
-- ----------------------------
DROP TABLE IF EXISTS `community_comment`;
CREATE TABLE `community_comment` (
  `comment_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `topic_id` INT NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,  -- ✅改这里
  `content` VARCHAR(255) DEFAULT NULL,
  `reply_id` INT DEFAULT NULL,
  `parent_id` INT DEFAULT NULL,
  `status` ENUM('normal','deleted') DEFAULT 'normal'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- community_department（不涉及用户ID，无需改）
-- ----------------------------
DROP TABLE IF EXISTS `community_department`;
CREATE TABLE `community_department` (
  `department_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `community_id` INT NOT NULL,
  `department_name` VARCHAR(255) NOT NULL,
  `status` TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- community_event
-- ----------------------------
DROP TABLE IF EXISTS `community_event`;
CREATE TABLE `community_event` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `community_id` INT NOT NULL,
  `title` VARCHAR(255) DEFAULT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `start_time` DATETIME DEFAULT NULL,
  `end_time` DATETIME DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `creator_id` VARCHAR(36), -- ✅改这里
  `status` ENUM('pending','approved','cancelled') DEFAULT 'pending',
  `created_at` DATETIME DEFAULT NULL,
  `participant_count` INT DEFAULT 0,
  `album_name` VARCHAR(255) DEFAULT NULL,
  `cover_url` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- community_invite
-- ----------------------------
DROP TABLE IF EXISTS `community_invite`;
CREATE TABLE `community_invite` (
  `invite_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `community_id` INT NOT NULL,
  `inviter_id` VARCHAR(36) NOT NULL, -- ✅改
  `invitee_id` VARCHAR(36) NOT NULL, -- ✅改
  `created_time` DATETIME NOT NULL,
  `status` ENUM('pending','accepted','rejected','expired') NOT NULL,
  `handled_at` DATETIME DEFAULT NULL,
  `remark` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- community_position（不涉及用户ID）
-- ----------------------------
DROP TABLE IF EXISTS `community_position`;
CREATE TABLE `community_position` (
  `level_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `community_id` INT NOT NULL,
  `level_name` VARCHAR(255) DEFAULT NULL,
  `level` VARCHAR(255) DEFAULT NULL,
  `permissions` JSON DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- community_topic（已经是对的）
-- ----------------------------
DROP TABLE IF EXISTS `community_topic`;
CREATE TABLE `community_topic` (
  `topic_id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `community_id` INT NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) DEFAULT NULL,
  `content` VARCHAR(255) DEFAULT NULL,
  `like_count` INT DEFAULT 0,
  `comment_count` INT DEFAULT 0,
  `view_count` INT DEFAULT 0,
  `status` ENUM('normal','deleted') DEFAULT 'normal',
  `created_at` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- user_community（已经正确）
-- ----------------------------
DROP TABLE IF EXISTS `user_community`;
CREATE TABLE `user_community` (
  `community_id` INT NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `status` ENUM('joined','left','pending','reject') NOT NULL,
  `join_time` DATETIME NOT NULL,
  PRIMARY KEY (`community_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- user_department_position（已经正确）
-- ----------------------------
DROP TABLE IF EXISTS `user_department_position`;
CREATE TABLE `user_department_position` (
  `community_id` INT NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `department_id` INT DEFAULT NULL,
  `position_id` INT DEFAULT NULL,
  `start_time` DATETIME DEFAULT NULL,
  `end_time` DATETIME DEFAULT NULL,
  PRIMARY KEY (`community_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;