USE legal_advisor;

CREATE TABLE analysis_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  risk_level VARCHAR(20),
  summary TEXT,
  status VARCHAR(50),
  analysis_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_analysis_history_user_id (user_id),
  CONSTRAINT fk_analysis_history_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
