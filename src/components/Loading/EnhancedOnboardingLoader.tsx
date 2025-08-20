import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Brain, 
  Database, 
  Bot, 
  Cpu,
  CircuitBoard,
  Sparkles,
  Zap,
  Shield,
  Eye,
  Activity,
  MessageSquare,
  CheckCircle,
  Loader2,
  Wifi,
  Settings,
  FileText,
  Code,
  Server,
  Network,
  HardDrive,
  Memory,
  Power,
  Battery,
  Thermometer,
  Gauge,
  Lightbulb,
  Fan,
  Cog,
  Lock,
  Unlock,
  Key,
  Fingerprint,
  Scan,
  QrCode,
  Barcode,
  Tag,
  Hash,
  Binary,
  Cloud,
  Globe,
  MapPin,
  Navigation,
  Compass,
  Antenna,
  Transmitter,
  Receiver,
  Modem,
  Router,
  Switch,
  Hub,
  Gateway,
  Bridge,
  Repeater,
  Amplifier,
  Filter,
  Sensor,
  Detector,
  Scanner,
  Camera,
  Microphone,
  Speaker,
  Headphones,
  Display,
  Screen,
  Tablet,
  Laptop,
  Desktop,
  Workstation,
  Terminal,
  Console,
  Keyboard,
  Mouse,
  Touchpad,
  Joystick,
  Gamepad,
  Controller,
  Remote,
  Handheld,
  Watch,
  Headset,
  Earbuds,
  Chip,
  Card,
  Token,
  Medal,
  Trophy,
  Award,
  Badge,
  Certificate,
  Diploma,
  License,
  CreditCard,
  Wallet,
  Safe,
  Vault,
  Cabinet,
  Drawer,
  Shelf,
  Rack,
  Mount,
  Stand,
  Platform,
  Stage,
  Home,
  Building,
  Tower,
  Castle,
  Palace,
  Villa,
  Cottage,
  Cabin,
  Tent,
  Houseboat,
  Submarine,
  Rocket,
  Satellite,
  Planet,
  Star,
  Moon,
  Sun,
  Galaxy,
  Space,
  Orbit,
  Path,
  Route,
  Road,
  Street,
  Avenue,
  Highway,
  Drive,
  Lane,
  Alley,
  Court,
  Place,
  Square,
  Circle,
  Triangle,
  Rectangle,
  Pentagon,
  Hexagon,
  Octagon,
  Diamond,
  Heart,
  Cross,
  Plus,
  Minus,
  Divide,
  Multiply,
  Equal,
  NotEqual,
  GreaterThan,
  LessThan,
  GreaterThanOrEqual,
  LessThanOrEqual,
  Infinity,
  Pi,
  Sigma,
  Omega,
  Alpha,
  Beta,
  Gamma,
  Delta,
  Epsilon,
  Zeta,
  Eta,
  Theta,
  Iota,
  Kappa,
  Lambda,
  Mu,
  Nu,
  Xi,
  Omicron,
  Rho,
  Tau,
  Upsilon,
  Phi,
  Chi,
  Psi
} from 'lucide-react';

interface EnhancedOnboardingLoaderProps {
  isProcessing: boolean;
  currentProcess: 'pdf' | 'rules' | 'knowledgebase';
  progress: number;
  onComplete: () => void;
  pdfFileName?: string;
  currentSubStage?: string;
}

const processingStages = [
  { 
    name: 'Uploading PDF', 
    icon: Upload, 
    color: 'text-blue-500',
    description: 'Processing device documentation',
    subStages: ['Reading file', 'Extracting content', 'Preparing for analysis']
  },
  { 
    name: 'AI Analysis', 
    icon: Brain, 
    color: 'text-purple-500',
    description: 'Analyzing with artificial intelligence',
    subStages: ['Processing text', 'Identifying patterns', 'Generating insights']
  },
  { 
    name: 'Creating Device', 
    icon: Database, 
    color: 'text-green-500',
    description: 'Setting up device in system',
    subStages: ['Creating profile', 'Configuring settings', 'Establishing connections']
  },
  { 
    name: 'AI Assistant Setup', 
    icon: Bot, 
    color: 'text-orange-500',
    description: 'Initializing AI chat capabilities',
    subStages: ['Loading knowledge base', 'Training AI model', 'Preparing chat interface']
  }
];

export const EnhancedOnboardingLoader: React.FC<EnhancedOnboardingLoaderProps> = ({
  isProcessing,
  currentProcess,
  progress,
  onComplete,
  pdfFileName,
  currentSubStage
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, vx: number, vy: number, color: string, size: number}>>([]);
  const [floatingIcons, setFloatingIcons] = useState<Array<{id: number, icon: any, x: number, y: number, delay: number, rotation: number}>>([]);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [glowEffect, setGlowEffect] = useState(false);

  // Generate animated particles
  useEffect(() => {
    const newParticles = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      color: ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 6)],
      size: Math.random() * 3 + 1
    }));
    setParticles(newParticles);

    // Generate floating device icons
    const iconList = [
      Cpu, Brain, CircuitBoard, Database, Bot, Sparkles, Zap, Shield, Eye, Activity,
      MessageSquare, Wifi, Settings, FileText, Code, Server, Network, HardDrive,
      Memory, Power, Battery, Thermometer, Gauge, Lightbulb, Fan, Cog, Lock,
      Unlock, Key, Fingerprint, Scan, QrCode, Barcode, Tag, Hash, Binary, Cloud,
      Globe, MapPin, Navigation, Compass, Antenna, Transmitter, Receiver, Modem,
      Router, Switch, Hub, Gateway, Bridge, Repeater, Amplifier, Filter, Sensor,
      Detector, Scanner, Camera, Microphone, Speaker, Headphones, Display, Screen,
      Tablet, Laptop, Desktop, Workstation, Terminal, Console, Keyboard, Mouse,
      Touchpad, Joystick, Gamepad, Controller, Remote, Handheld, Watch,
      Headset, Earbuds, Chip, Card, Token, Medal,
      Trophy, Award, Badge, Certificate, Diploma, License,
      CreditCard, Wallet, Safe, Vault, Cabinet, Drawer, Shelf, Rack,
      Mount, Stand, Platform, Stage, Home,
      Building, Tower, Castle, Palace,
      Villa, Cottage, Cabin, Tent, Houseboat, Submarine,
      Rocket, Satellite, Planet, Star, Moon, Sun, Galaxy,
      Space, Orbit, Path, Route, Road, Street, Avenue,
      Highway, Drive, Lane, Alley, Court,
      Place, Square, Circle, Triangle, Rectangle, Pentagon, Hexagon, Octagon,
      Diamond, Heart, Cross, Plus, Minus, Divide, Multiply, Equal, NotEqual,
      GreaterThan, LessThan, GreaterThanOrEqual, LessThanOrEqual, Infinity, Pi,
      Sigma, Omega, Alpha, Beta, Gamma, Delta, Epsilon, Zeta, Eta, Theta, Iota,
      Kappa, Lambda, Mu, Nu, Xi, Omicron, Rho, Tau, Upsilon, Phi, Chi, Psi
    ];

    const newFloatingIcons = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      icon: iconList[Math.floor(Math.random() * iconList.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2000,
      rotation: Math.random() * 360
    }));
    setFloatingIcons(newFloatingIcons);
  }, []);

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + particle.vx + 100) % 100,
        y: (particle.y + particle.vy + 100) % 100
      })));
    }, 30);

    return () => clearInterval(interval);
  }, []);

  // Pulse and glow effects
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseEffect(prev => !prev);
    }, 1000);

    const glowInterval = setInterval(() => {
      setGlowEffect(prev => !prev);
    }, 2000);

    return () => {
      clearInterval(pulseInterval);
      clearInterval(glowInterval);
    };
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  }, [progress, onComplete]);

  useEffect(() => {
    // Update current stage based on progress
    if (progress < 25) setCurrentStage(0);
    else if (progress < 50) setCurrentStage(1);
    else if (progress < 75) setCurrentStage(2);
    else setCurrentStage(3);
  }, [progress]);

  return (
    <div className="min-h-[600px] flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900">
        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map(particle => (
              <div
              key={particle.id}
              className="absolute rounded-full opacity-40 animate-pulse"
                style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                animationDelay: `${particle.id * 0.1}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
        </div>

        {/* Floating Device Icons */}
        <div className="absolute inset-0 overflow-hidden">
          {floatingIcons.map(({ id, icon: Icon, x, y, delay, rotation }) => (
            <div
              key={id}
              className="absolute text-white/10 transition-all duration-3000 animate-bounce"
                style={{
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `${delay}ms`,
                transform: `rotate(${rotation}deg)`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            >
              <Icon className="w-4 h-4" />
            </div>
            ))}
          </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-2xl w-full border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 transition-all duration-1000 ${
            pulseEffect ? 'scale-110' : 'scale-100'
          } ${
            glowEffect ? 'shadow-2xl shadow-blue-400/50 ring-4 ring-blue-400/30' : ''
          } bg-gradient-to-br from-blue-500 to-purple-600`}>
            <div className="relative">
              {processingStages[currentStage] && React.createElement(processingStages[currentStage].icon, {
                className: `w-10 h-10 text-white ${pulseEffect ? 'animate-pulse' : ''}`
              })}
              {currentStage < processingStages.length - 1 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
              )}
              </div>
            </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            {processingStages[currentStage]?.name || 'Processing...'}
          </h2>
          
          <p className="text-blue-200 text-lg mb-4">
            {processingStages[currentStage]?.description || 'Setting up your device...'}
          </p>

          {pdfFileName && (
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <FileText className="w-4 h-4 text-blue-300" />
              <span className="text-blue-200 text-sm">{pdfFileName}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-sm">AI Integration Progress</span>
            <span className="text-blue-400 text-sm font-medium">{Math.round(progress)}%</span>
              </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Current Stage Details */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                processingStages[currentStage]?.color.replace('text-', 'bg-').replace('-500', '-500/20')
              }`}>
                {processingStages[currentStage] && React.createElement(processingStages[currentStage].icon, {
                  className: `w-6 h-6 ${processingStages[currentStage]?.color}`
                })}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">
                  {processingStages[currentStage]?.name}
                </h3>
                <p className="text-blue-200 text-sm">
                  {currentSubStage || processingStages[currentStage]?.subStages[0]}
                </p>
              </div>
        </div>

            {/* Sub-stages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {processingStages[currentStage]?.subStages.map((subStage, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-500 ${
                    index === 0 ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    index === 0 ? 'bg-blue-400 animate-pulse' : 'bg-white/30'
                  }`}></div>
                  <span className={`text-xs ${
                    index === 0 ? 'text-blue-200' : 'text-white/60'
                  }`}>
                    {subStage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Transformation Visualization */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {processingStages.map((stage, index) => (
            <div 
              key={index}
              className={`text-center p-4 rounded-xl transition-all duration-500 ${
                index <= currentStage 
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30' 
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <div className={`w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center transition-all duration-500 ${
                index <= currentStage 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white' 
                  : 'bg-white/10 text-white/40'
              }`}>
                {React.createElement(stage.icon, { className: 'w-4 h-4' })}
                </div>
              <div className={`text-xs font-medium transition-all duration-500 ${
                index <= currentStage ? 'text-blue-200' : 'text-white/40'
                }`}>
                  {stage.name}
                </div>
              </div>
          ))}
        </div>

        {/* Status Message */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <span className="text-blue-200 text-sm">
              {currentSubStage || 'Processing your device...'}
            </span>
              </div>
            </div>
      </div>
    </div>
  );
};
