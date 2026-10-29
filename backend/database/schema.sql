-- =========================================================
-- Doctor Appointment Booking System - MySQL Schema
-- =========================================================
-- Run with:  mysql -u root -p < database/schema.sql
-- Or:        npm run db:init   (uses the credentials in .env)
-- =========================================================

CREATE DATABASE IF NOT EXISTS `doctor_appointment_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `doctor_appointment_db`;

-- ---------------------------------------------------------
-- users : single authentication table for all three roles
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(150) NOT NULL,
  `email`      VARCHAR(190) NOT NULL,
  `phone`      VARCHAR(30)  NOT NULL,
  `password`   VARCHAR(255) NOT NULL COMMENT 'bcrypt hash - never plain text',
  `role`       ENUM('patient','doctor','admin') NOT NULL DEFAULT 'patient',
  `status`     ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- specializations : lookup table for doctor categories
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `specializations` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(120) NOT NULL,
  `description` TEXT NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_specializations_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- patients : extended profile for role = 'patient'
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `patients` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`         INT UNSIGNED NOT NULL,
  `date_of_birth`   DATE NULL,
  `gender`          ENUM('male','female','other') NOT NULL DEFAULT 'other',
  `address`         VARCHAR(255) NULL,
  `medical_history` TEXT NULL,
  `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_patients_user` (`user_id`),
  CONSTRAINT `fk_patients_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- doctors : extended profile for role = 'doctor'
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `doctors` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`           INT UNSIGNED NOT NULL,
  `specialization_id` INT UNSIGNED NULL,
  `qualification`     VARCHAR(255) NULL,
  `experience`        INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'years of experience',
  `consultation_fee`  DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `bio`               TEXT NULL,
  `status`            ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doctors_user` (`user_id`),
  KEY `idx_doctors_specialization` (`specialization_id`),
  KEY `idx_doctors_status` (`status`),
  CONSTRAINT `fk_doctors_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_doctors_specialization` FOREIGN KEY (`specialization_id`)
    REFERENCES `specializations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- doctor_schedules : weekly availability, one row per weekday
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `doctor_schedules` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `doctor_id`  INT UNSIGNED NOT NULL,
  `day`        ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time`   TIME NOT NULL,
  `available`  TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_schedule_doctor_day` (`doctor_id`, `day`),
  CONSTRAINT `fk_schedule_doctor` FOREIGN KEY (`doctor_id`)
    REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- appointments : the core booking table
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `appointments` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patient_id`       INT UNSIGNED NOT NULL,
  `doctor_id`        INT UNSIGNED NOT NULL,
  `appointment_date` DATE NOT NULL,
  `appointment_time` TIME NOT NULL,
  `reason`           TEXT NULL,
  `status`           ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  `payment_status`   ENUM('unpaid','pending','paid','failed','refunded') NOT NULL DEFAULT 'unpaid',
  `payment_method`   VARCHAR(30) NULL,
  `amount`           DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `payment_reference` VARCHAR(100) NULL,
  `paid_at`          DATETIME NULL,
  `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_appt_patient` (`patient_id`),
  KEY `idx_appt_doctor_date` (`doctor_id`, `appointment_date`),
  KEY `idx_appt_status` (`status`),
  KEY `idx_appt_payment_status` (`payment_status`),
  CONSTRAINT `fk_appt_patient` FOREIGN KEY (`patient_id`)
    REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_appt_doctor` FOREIGN KEY (`doctor_id`)
    REFERENCES `doctors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- password_resets : tokens for the "forgot password" flow
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `token`      VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used`       TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reset_token` (`token`),
  CONSTRAINT `fk_reset_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- payments : one row per payment attempt for an appointment
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payments` (
  `id`                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `appointment_id`      INT UNSIGNED NOT NULL,
  `patient_id`          INT UNSIGNED NOT NULL,
  `provider`            VARCHAR(30) NOT NULL DEFAULT 'razorpay',
  `method`              VARCHAR(30) NOT NULL,
  `amount`              DECIMAL(10, 2) NOT NULL,
  `currency`            VARCHAR(10) NOT NULL DEFAULT 'INR',
  `status`              ENUM('created','pending','paid','failed','refunded') NOT NULL DEFAULT 'created',
  `provider_order_id`   VARCHAR(100) NULL,
  `provider_payment_id` VARCHAR(100) NULL,
  `failure_reason`      VARCHAR(255) NULL,
  `created_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_order` (`provider_order_id`),
  KEY `idx_payment_appointment` (`appointment_id`),
  KEY `idx_payment_status` (`status`),
  CONSTRAINT `fk_payment_appointment` FOREIGN KEY (`appointment_id`)
    REFERENCES `appointments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payment_patient` FOREIGN KEY (`patient_id`)
    REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
