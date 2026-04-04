USE legal_advisor;

CREATE TABLE IF NOT EXISTS templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    preview_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO templates (title, description, category, preview_url) VALUES
('Consignment Agreement', 'Template for selling goods through a consignee.', 'Services', '/templates/Consignment-Agreement-Template.pdf'),
('Freelance Agreement', 'Contract for independent freelance service work.', 'Services', '/templates/Freelance-Agreement-.pdf'),
('Handyman Contract', 'Agreement for repair, maintenance, and handyman services.', 'Services', '/templates/Handyman-Contract.pdf'),
('Investment Agreement', 'Template for documenting investment terms between parties.', 'Investment', '/templates/Investment-Agreement-Template.pdf'),
('Loan Agreement', 'Agreement defining repayment terms, interest, and borrower obligations.', 'Loan', '/templates/Loan-Agreement.pdf');

SELECT * FROM templates;
