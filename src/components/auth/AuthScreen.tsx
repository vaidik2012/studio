
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const validateUsername = (name: string) => {
    const regex = /^[a-zA-Z0-9_.\[\]]+$/;
    return regex.test(name) && !name.includes(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    if (!validateUsername(username)) {
      toast({ 
        variant: "destructive", 
        title: "Invalid Username", 
        description: "Only letters, numbers, _, ., [, ] are allowed. No spaces." 
      });
      return;
    }

    setLoading(true);
    const email = `${username.toLowerCase()}@braxk.io`;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Check if username taken
        const usernameRef = doc(db, 'usernames', username.toLowerCase());
        const usernameSnap = await getDoc(usernameRef);
        
        if (usernameSnap.exists()) {
          throw new Error("Username already taken.");
        }

        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCred.user.uid;

        // Initialize Profile
        await setDoc(doc(db, 'users', uid), {
          username: username,
          xp: 0,
          level: 1,
          coins: 500,
          rank: 'Bronze',
          kills: 0,
          deaths: 0
        });

        // Reserve Username
        await setDoc(usernameRef, { uid });
      }
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Auth Error", 
        description: err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#14161A] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full scale-150 animate-pulse" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-background/80 backdrop-blur-2xl border-2 border-white/10 p-8 rounded-[2.5rem] shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-6xl font-black italic tracking-tighter text-primary uppercase">Braxk.io</h1>
            <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">The Multiverse Shooter</p>
          </div>

          <div className="flex bg-muted/50 p-1 rounded-2xl">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-black italic uppercase transition-all ${isLogin ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-black italic uppercase transition-all ${!isLogin ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-primary tracking-[0.2em] ml-2">Unique User ID</label>
              <Input 
                placeholder="ID_PLAYER..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-14 bg-white/5 border-white/10 rounded-2xl font-bold tracking-widest focus:border-primary text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-primary tracking-[0.2em] ml-2">Secure Pass</label>
              <Input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 bg-white/5 border-white/10 rounded-2xl font-bold tracking-widest focus:border-primary text-white"
                required
              />
            </div>
            
            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-primary hover:bg-white hover:text-primary text-white font-black italic text-2xl rounded-2xl transition-all border-b-4 border-primary/50 active:border-b-0 active:translate-y-1 mt-4"
            >
              {loading ? "PROCESSING..." : (isLogin ? "JOIN BATTLE" : "CREATE ACCOUNT")}
            </Button>
          </form>

          <p className="text-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
            By entering you agree to the multiverse terms.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
