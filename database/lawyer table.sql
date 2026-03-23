/* Enter "USE {database};" to start exploring your data.
   Press Command + I to try out AI-generated SQL queries or SQL rewrite using Chat2Query. */
USE legal_advisor;
CREATE TABLE lawyers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    firm VARCHAR(100),
    specialty VARCHAR(50),
    city VARCHAR(50),
    rating DECIMAL(2,1),
    reviews INT DEFAULT 0,
    experience VARCHAR(20),
    education VARCHAR(100),
    hourly_rate VARCHAR(20),
    image_url VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    availability VARCHAR(50)
);

INSERT INTO lawyers (name, firm, specialty, city, rating, reviews, experience, education, hourly_rate, image_url, phone, email, website, availability)
VALUES 
('Bayan Jalal', 'Qandil Legal Associates', 'Family Law', 'Hawler', 4.8, 85, '10 years', 'Salahaddin University', '$150', '', '+964-750-111-2233', 'bayan@qandil-legal.com', 'https://qandil-legal.com', 'Available Tomorrow'),
('Trazin Ahmad', 'Goran Law Firm', 'Corporate Law', 'Sulaymaniyah', 4.9, 120, '15 years', 'University of Sulaimani', '$200', '', '+964-770-444-5566', 'trazin@goranlaw.iq', 'https://goranlaw.iq', 'Available for Consultation'),
('Nishtiman Kareem', 'Baba Gurgur Legal', 'Property Law', 'Kerkuk', 4.7, 64, '8 years', 'Kerkuk University', '$120', '', '+964-750-999-8877', 'nishtiman@kerkuk-advocate.com', 'https://babagurgur-legal.iq', 'Urgent Cases Only'),
('Hiwa Rostam', 'Zagros Defense', 'Criminal Defense', 'Duhok', 4.6, 92, '20 years', 'University of Duhok', '$180', '', '+964-750-333-4455', 'hiwa@zagros-defense.iq', 'https://zagros-defense.iq', 'Available Now'),
('Araz Bakir', 'Halabja Justice Partners', 'International Law', 'Halabja', 4.9, 45, '12 years', 'AUIS', '$250', '', '+964-770-222-1100', 'araz@halabja-justice.com', 'https://halabja-justice.com', 'By Appointment Only');

SHOW TABLES;
SELECT * FROM lawyers;