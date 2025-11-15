import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Mail, CheckCircle, Plus, Trash2, Star, Upload, Link2, Image } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Navbar } from '../components/navigation/Navbar';
import { Footer } from '../components/navigation/Footer';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// Twitter/X icon component
const XIcon = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface ProfileProps {
  onBack: () => void;
  onLogout: () => void;
  onDashboardClick: () => void;
  user: {
    username: string;
    email?: string;
    profileImage?: string;
    xAccount?: string;
    gmailAccount?: string;
    wallets: { address: string; isPrimary: boolean }[];
    accountType?: 'influencer' | 'advertiser';
  };
  onUpdateProfile: (updatedUser: any) => void;
}

export function Profile({ onBack, onLogout, onDashboardClick, user, onUpdateProfile }: ProfileProps) {
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email || '');
  const [xAccount, setXAccount] = useState(user.xAccount || '');
  const [gmailAccount, setGmailAccount] = useState(user.gmailAccount || '');
  const [wallets, setWallets] = useState(user.wallets);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [showProfileImageOptions, setShowProfileImageOptions] = useState(false);
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const profileImageDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown with ESC key or click outside
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showProfileImageOptions) {
        setShowProfileImageOptions(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (profileImageDropdownRef.current && !profileImageDropdownRef.current.contains(event.target as Node)) {
        setShowProfileImageOptions(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileImageOptions]);

  const handleSaveUsername = () => {
    onUpdateProfile({ ...user, username });
    setIsEditingUsername(false);
  };

  const handleConnectX = () => {
    const handle = prompt('Enter your X (Twitter) handle:');
    if (handle) {
      const cleanHandle = handle.replace('@', '');
      setXAccount(cleanHandle);
      onUpdateProfile({ ...user, xAccount: cleanHandle });
    }
  };

  const handleDisconnectX = () => {
    if (confirm('Are you sure you want to disconnect your X account?')) {
      setXAccount('');
      onUpdateProfile({ ...user, xAccount: '' });
    }
  };

  const handleConnectGmail = () => {
    const gmail = prompt('Enter your Gmail address:');
    if (gmail) {
      setGmailAccount(gmail);
      onUpdateProfile({ ...user, gmailAccount: gmail });
    }
  };

  const handleDisconnectGmail = () => {
    if (confirm('Are you sure you want to disconnect your Gmail account?')) {
      setGmailAccount('');
      onUpdateProfile({ ...user, gmailAccount: '' });
    }
  };

  const handleAddWallet = () => {
    if (newWalletAddress.trim()) {
      const isPrimary = wallets.length === 0;
      const newWallets = [...wallets, { address: newWalletAddress, isPrimary }];
      setWallets(newWallets);
      onUpdateProfile({ ...user, wallets: newWallets });
      setNewWalletAddress('');
      setShowAddWallet(false);
    }
  };

  const handleRemoveWallet = (index: number) => {
    const wallet = wallets[index];
    if (wallet.isPrimary) {
      alert('Cannot remove primary wallet. Please set another wallet as primary first.');
      return;
    }
    if (confirm('Are you sure you want to remove this wallet?')) {
      const newWallets = wallets.filter((_, i) => i !== index);
      setWallets(newWallets);
      onUpdateProfile({ ...user, wallets: newWallets });
    }
  };

  const handleSetPrimaryWallet = (index: number) => {
    const newWallets = wallets.map((wallet, i) => ({
      ...wallet,
      isPrimary: i === index,
    }));
    setWallets(newWallets);
    onUpdateProfile({ ...user, wallets: newWallets });
  };

  const handleProfileImageLink = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      onUpdateProfile({ ...user, profileImage: url });
      setShowProfileImageOptions(false);
    }
  };

  const handleRemoveProfileImage = () => {
    if (confirm('Are you sure you want to remove your profile picture?')) {
      onUpdateProfile({ ...user, profileImage: '' });
      setShowProfileImageOptions(false);
    }
  };

  const handleUploadProfileImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onUpdateProfile({ ...user, profileImage: base64String });
        setShowProfileImageOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B1220] to-[#0F172A]">
      <Navbar 
        isLoggedIn={true}
        user={user}
        onProfileClick={() => {}}
        onDashboardClick={onDashboardClick}
        onLogout={onLogout}
      />
      
      <main className="pt-32 pb-16 px-20">
        <div className="max-w-[1440px] mx-auto">
          {/* Back Button */}
          <motion.button
            onClick={onBack}
            className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#1D9BF0] mb-8 transition-colors duration-200"
            whileHover={{ x: -4 }}
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </motion.button>

          <div className="max-w-4xl mx-auto">
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <GlassCard className="p-8 mb-6">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    {/* Profile Image */}
                    <div className="relative">
                      {user.profileImage ? (
                        <ImageWithFallback
                          src={user.profileImage}
                          alt={username}
                          className="w-24 h-24 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1D9BF0] to-[#22D3EE] flex items-center justify-center">
                          <span className="text-white text-3xl font-semibold">
                            {username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {/* Edit Profile Picture Button */}
                      <motion.button
                        onClick={() => setShowProfileImageOptions(!showProfileImageOptions)}
                        className="absolute bottom-0 right-0 p-2 bg-[#1D9BF0] rounded-full text-white shadow-lg hover:bg-[#1a8cd8]"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Upload size={16} />
                      </motion.button>
                      
                      {/* Profile Image Options Dropdown */}
                      <AnimatePresence>
                        {showProfileImageOptions && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full mt-2 right-0 glass-card rounded-xl overflow-hidden border border-white/10 z-10"
                            style={{ width: '200px' }}
                            ref={profileImageDropdownRef}
                          >
                            <div className="py-2">
                              <button
                                onClick={handleProfileImageLink}
                                className="w-full px-4 py-3 text-left text-[#E5E7EB] hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
                              >
                                <Link2 size={18} />
                                <span>Add Image URL</span>
                              </button>
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full px-4 py-3 text-left text-[#E5E7EB] hover:bg-white/10 transition-colors duration-200 flex items-center gap-3"
                              >
                                <Upload size={18} />
                                <span>Upload Image</span>
                              </button>
                              {user.profileImage && (
                                <>
                                  <div className="my-2 mx-4 border-t border-white/10" />
                                  <button
                                    onClick={handleRemoveProfileImage}
                                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-400/10 transition-colors duration-200 flex items-center gap-3"
                                  >
                                    <Trash2 size={18} />
                                    <span>Remove</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Username */}
                    <div className="flex-1">
                      {isEditingUsername ? (
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="px-4 py-2 rounded-lg glass-card text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]"
                            autoFocus
                          />
                          <motion.button
                            onClick={handleSaveUsername}
                            className="px-4 py-2 rounded-lg bg-[#1D9BF0] text-white hover:bg-[#1a8cd8]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Save
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              setUsername(user.username);
                              setIsEditingUsername(false);
                            }}
                            className="px-4 py-2 rounded-lg text-[#9CA3AF] hover:text-[#E5E7EB]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Cancel
                          </motion.button>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-3">
                            <h1 className="text-[#E5E7EB]" style={{ fontSize: '2rem', fontWeight: 600 }}>
                              {username}
                            </h1>
                            <motion.button
                              onClick={() => setIsEditingUsername(true)}
                              className="text-[#1D9BF0] hover:text-[#22D3EE] text-sm"
                              whileHover={{ scale: 1.05 }}
                            >
                              Edit
                            </motion.button>
                          </div>
                          {email && (
                            <p className="text-[#9CA3AF] mt-1">{email}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Account Type Badge - Right Side */}
                  {user.accountType && (
                    <div
                      className={`px-4 py-2 rounded-lg text-sm self-start ${
                        user.accountType === 'influencer'
                          ? 'bg-[#22D3EE]/20 text-[#22D3EE] border border-[#22D3EE]/30'
                          : 'bg-[#1D9BF0]/20 text-[#1D9BF0] border border-[#1D9BF0]/30'
                      }`}
                    >
                      {user.accountType === 'influencer' ? 'Influencer' : 'Advertiser'}
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>

            {/* Connected Accounts Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h2 className="text-[#E5E7EB] mb-4" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                Connected Accounts
              </h2>

              <div className="space-y-4 mb-6">
                {/* X Account */}
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#1D9BF0]/20 flex items-center justify-center">
                        <div className="text-[#1D9BF0]">
                          <XIcon size={24} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[#E5E7EB] font-medium">X (Twitter)</h3>
                        {xAccount ? (
                          <p className="text-[#9CA3AF] text-sm">@{xAccount}</p>
                        ) : (
                          <p className="text-[#9CA3AF] text-sm">Not connected</p>
                        )}
                      </div>
                    </div>
                    {xAccount ? (
                      <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-[#22D3EE]" />
                        <motion.button
                          onClick={handleDisconnectX}
                          className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Disconnect
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button
                        onClick={handleConnectX}
                        className="px-4 py-2 rounded-lg bg-[#1D9BF0] text-white hover:bg-[#1a8cd8]"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Connect
                      </motion.button>
                    )}
                  </div>
                </GlassCard>

                {/* Gmail Account */}
                <GlassCard className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#1D9BF0]/20 flex items-center justify-center">
                        <Mail size={24} className="text-[#1D9BF0]" />
                      </div>
                      <div>
                        <h3 className="text-[#E5E7EB] font-medium">Gmail</h3>
                        {gmailAccount ? (
                          <p className="text-[#9CA3AF] text-sm">{gmailAccount}</p>
                        ) : (
                          <p className="text-[#9CA3AF] text-sm">Not connected</p>
                        )}
                      </div>
                    </div>
                    {gmailAccount ? (
                      <div className="flex items-center gap-3">
                        <CheckCircle size={20} className="text-[#22D3EE]" />
                        <motion.button
                          onClick={handleDisconnectGmail}
                          className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Disconnect
                        </motion.button>
                      </div>
                    ) : (
                      <motion.button
                        onClick={handleConnectGmail}
                        className="px-4 py-2 rounded-lg bg-[#1D9BF0] text-white hover:bg-[#1a8cd8]"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Connect
                      </motion.button>
                    )}
                  </div>
                </GlassCard>
              </div>
            </motion.div>

            {/* Crypto Wallets Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[#E5E7EB]" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                  Crypto Wallets
                </h2>
                <motion.button
                  onClick={() => setShowAddWallet(!showAddWallet)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D9BF0] text-white hover:bg-[#1a8cd8]"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Plus size={20} />
                  Add Wallet
                </motion.button>
              </div>

              <div className="space-y-4">
                {/* Add Wallet Form */}
                <AnimatePresence>
                  {showAddWallet && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <GlassCard className="p-6">
                        <h3 className="text-[#E5E7EB] mb-4 font-medium">Add New Wallet</h3>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={newWalletAddress}
                            onChange={(e) => setNewWalletAddress(e.target.value)}
                            placeholder="Enter wallet address"
                            className="flex-1 px-4 py-2 rounded-lg glass-card text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]"
                          />
                          <motion.button
                            onClick={handleAddWallet}
                            className="px-6 py-2 rounded-lg bg-[#1D9BF0] text-white hover:bg-[#1a8cd8]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Add
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              setShowAddWallet(false);
                              setNewWalletAddress('');
                            }}
                            className="px-6 py-2 rounded-lg text-[#9CA3AF] hover:text-[#E5E7EB]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </GlassCard>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Wallet List */}
                {wallets.map((wallet, index) => (
                  <GlassCard key={index} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-[#22D3EE]/20 flex items-center justify-center flex-shrink-0">
                          {wallet.isPrimary ? (
                            <Star size={24} className="text-[#22D3EE] fill-[#22D3EE]" />
                          ) : (
                            <Star size={24} className="text-[#22D3EE]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[#E5E7EB] font-medium">
                              {wallet.isPrimary ? 'Primary Wallet' : 'Wallet'}
                            </h3>
                          </div>
                          <p className="text-[#9CA3AF] text-sm truncate">{wallet.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!wallet.isPrimary && (
                          <motion.button
                            onClick={() => handleSetPrimaryWallet(index)}
                            className="px-4 py-2 rounded-lg text-[#22D3EE] hover:bg-[#22D3EE]/10 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Set as Primary
                          </motion.button>
                        )}
                        {!wallet.isPrimary && (
                          <motion.button
                            onClick={() => handleRemoveWallet(index)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 size={20} />
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}

                {wallets.length === 0 && (
                  <GlassCard className="p-6 text-center">
                    <p className="text-[#9CA3AF]">No wallets connected</p>
                  </GlassCard>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 1024px) {
          main {
            padding-left: 72px;
            padding-right: 72px;
          }
        }
        @media (max-width: 768px) {
          main {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
      `}</style>

      {/* Hidden File Input for Profile Image Upload */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleUploadProfileImage}
      />
    </div>
  );
}