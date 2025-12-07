
import { User } from '../types';

const USERS_KEY = 'wanderai_users';
const SESSION_KEY = 'wanderai_session_user';

interface StoredUser extends User {
  passwordHash: string; // simulating hash
}

// Simple simulation of delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to "hash" passwords (in real app, use bcrypt on server)
// For client-side demo, we just obfuscate
const hashPassword = (pwd: string) => btoa(pwd); 

export const authService = {
  
  async login(email: string, password: string): Promise<User> {
    await delay(800); // Simulate network
    
    const usersJson = localStorage.getItem(USERS_KEY);
    const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : [];
    
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      throw new Error('No account found with this email.');
    }

    if (user.passwordHash !== hashPassword(password)) {
        throw new Error('Incorrect password.');
    }

    // Return user without sensitive data
    const { passwordHash, ...safeUser } = user;
    
    // Persist session
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return safeUser;
  },

  async register(name: string, email: string, password: string, gender: 'male' | 'female' | 'other', country: string): Promise<User> {
    await delay(1000); // Simulate network

    const usersJson = localStorage.getItem(USERS_KEY);
    const users: StoredUser[] = usersJson ? JSON.parse(usersJson) : [];

    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('User already exists with this email');
    }

    // Generate Avatar based on gender using comma-separated format
    let avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    
    if (gender === 'male') {
        // Force short hair styles and allow facial hair
        avatarUrl += '&top=shortHair,shortHairTheCaesar,shortHairTheCaesarSidePart,shortHairDreads01,shortHairFrizzle&facialHairProbability=30';
    } else if (gender === 'female') {
        // Force long hair styles and disable facial hair
        avatarUrl += '&top=longHairBigHair,longHairBob,longHairBun,longHairCurly,longHairStraight,longHairStraight2&facialHairProbability=0';
    }

    const newUser: StoredUser = {
      id: Date.now().toString(),
      name,
      email: email.toLowerCase(),
      gender,
      country,
      passwordHash: hashPassword(password),
      avatar: avatarUrl
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const { passwordHash, ...safeUser } = newUser;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    
    return safeUser;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser(): User | null {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  }
};
