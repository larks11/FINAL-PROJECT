import bcrypt from 'bcryptjs';

const users = [
  {
    name: 'Admin User',
    email: 'admin@email.com',
    password: bcrypt.hashSync('admin123', 10),
    isAdmin: true,
  },
  {
    name: 'Kent',
    email: 'kent@email.com',
    password: bcrypt.hashSync('123456', 10),
  },
  {
    name: 'Silao',
    email: 'silao@email.com',
    password: bcrypt.hashSync('123456', 10),
  },
];

export default users;
