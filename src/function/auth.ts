import 'dotenv/config'; 
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req: any, res: any) => {
  const { email, password, name } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword },
    });
    res.status(201).json({ message: 'Пользователь создан', userId: user.id });
  } catch (e) {
    res.status(400).json({ error: 'Email уже занят' });
  }
};


export const login = async (req: any, res: any) => {
  const { email, password } = req.body;
  
  if (!JWT_SECRET) return res.status(500).json({ error: 'Ошибка сервера' });

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign(
      { userId: user.id, roleId: user.roleId }, 
      JWT_SECRET, 
      { expiresIn: '12h' } 
    );
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Неверные учетные данные' });
  }
};

export const getProfile = async (req: any, res: any) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, email: true, roleId: true }
  });
  res.json(user);
};

export const updateProfile = async (req: any, res: any) => {
  const { name, email } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, email }
    });
    res.json(updatedUser);
  } catch (e) {
    res.status(400).json({ error: "Email уже занят или данные неверны" });
  }
};