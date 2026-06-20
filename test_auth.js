const run = async () => {
  const res = await fetch('http://localhost:3001/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'testuser@example.com',
      password: 'SecurePass123!',
      firstName: 'Test',
      lastName: 'User',
      companyName: 'Test Corp'
    })
  });
  const text = await res.text();
  console.log('Register Response Status:', res.status);
  console.log('Register Response Text:', text);

  if (res.status === 201) {
    const loginRes = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'SecurePass123!'
      })
    });
    const loginText = await loginRes.text();
    console.log('Login Response Status:', loginRes.status);
    console.log('Login Response Text:', loginText);
  }
};

run().catch(console.error);
