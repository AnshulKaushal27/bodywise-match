import docx

doc = docx.Document('Mosaic_Fellowship_Materials/Be_Bodywise_Customer_Problems_and_Contact_Directory.docx')
t18 = doc.tables[18]

# 1. Sonika
t18.rows[1].cells[1].text = 'Sonika'
t18.rows[1].cells[2].text = '+91 9463747241'
t18.rows[1].cells[3].text = 'Be Bodywise – Hair Care Product'
t18.rows[1].cells[4].text = 'Smooth and easy ordering process on website/app.'
t18.rows[1].cells[5].text = 'Guidance vacuum post-checkout; did not know correct usage frequency; unhelpful support.'
t18.rows[1].cells[6].text = 'Wants an AI assistant to guide post-purchase usage, answer questions and track progress.\nConsent: [ Agreed to share with Mosaic for Fellowship Challenge ]'

# 2. Nikhil
t18.rows[2].cells[1].text = 'Nikhil'
t18.rows[2].cells[2].text = '+91 9549197684'
t18.rows[2].cells[3].text = 'Be Bodywise – Hair Growth Gummies'
t18.rows[2].cells[4].text = 'Great taste, enjoyable gummy format is much easier to take daily than tablets.'
t18.rows[2].cells[5].text = 'Used for 2–3 months with zero noticeable hairfall reduction; occasionally forgets daily dose; feels price is high.'
t18.rows[2].cells[6].text = 'Wants an adherence & consumption tracker plus hair growth milestone timeline to verify efficacy.\nConsent: [ Agreed to share with Mosaic for Fellowship Challenge ]'

# 3. Karamjit
t18.rows[3].cells[1].text = 'Karamjit'
t18.rows[3].cells[2].text = '+91 9041061840'
t18.rows[3].cells[3].text = '2% BHA Body Acne Spray / Mist from Be Bodywise'
t18.rows[3].cells[4].text = '360° spray nozzle clears back acne easily without assistance.'
t18.rows[3].cells[5].text = 'Leaves a tacky/sticky skin residue after application; triggered relentless automated WhatsApp/SMS promotional marketing spam.'
t18.rows[3].cells[6].text = 'Texture refinement to eliminate tackiness and an immediate opt-out option for promotional marketing messages.\nConsent: [ Agreed to share with Mosaic for Fellowship Challenge ]'

# 4. Renu Rishi
t18.rows[4].cells[1].text = 'Renu Rishi'
t18.rows[4].cells[2].text = '+91 9465073899'
t18.rows[4].cells[3].text = '10% Urea Body Lotion from Be Bodywise'
t18.rows[4].cells[4].text = 'Noticeable, visible smoothing of rough arm skin texture and bumpiness within two weeks of use.'
t18.rows[4].cells[5].text = 'None reported on efficacy; requested bundled routine offerings with body washes.'
t18.rows[4].cells[6].text = 'Clear routine pairing guides demonstrating how 10% Urea complements body washes.\nConsent: [ Agreed to share with Mosaic for Fellowship Challenge ]'

# 5. Sudarshan
t18.rows[5].cells[1].text = 'Sudarshan'
t18.rows[5].cells[2].text = '+91 9464728747'
t18.rows[5].cells[3].text = 'Little Joys Nutritional Product (Mosaic Portfolio)'
t18.rows[5].cells[4].text = 'Child consumed without resistance; pleasant taste.'
t18.rows[5].cells[5].text = 'Price feels somewhat high for ongoing multi-month daily consumption.'
t18.rows[5].cells[6].text = 'Better subscription pricing tiers and recurring loyalty discounts for multi-month adherence.\nConsent: [ Agreed to share with Mosaic for Fellowship Challenge ]'

doc.save('Mosaic_Fellowship_Materials/Be_Bodywise_Customer_Problems_and_Contact_Directory.docx')
print('Updated Directory docx successfully!')
