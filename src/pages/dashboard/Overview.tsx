import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2, Users, Users2 as Handshake, DollarSign, TrendingUp,
  Plus, MessageSquare, Clock, MapPin, Phone, ChevronRight,
  UserPlus, Send, Eye, CheckCircle, AlertCircle, Star, Activity,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const monthlyData = [
  { month: 'Mar', negociacoes: 12, fechamentos: 4 },
  { month: 'Abr', negociacoes: 18, fechamentos: 6 },
  { month: 'Mai', negociacoes: 15, fechamentos: 5 },
  { month: 'Jun', negociacoes: 22, fechamentos: 8 },
  { month: 'Jul', negociacoes: 19, fechamentos: 7 },
  { month: 'Ago', negociacoes: 28, fechamentos: 10 },
  { month: 'Set', negociacoes: 24, fechamentos: 9 },
  { month: 'Out', negociacoes: 31, fechamentos: 12 },
  { month: 'Nov', negociacoes: 27, fechamentos: 10 },
  { month: 'Dez', negociacoes: 35, fechamentos: 14 },
  { month: 'Jan', negociacoes: 29, fechamentos: 11 },
  { month: 'Fev', negociacoes: 38, fechamentos: 15 },
]

const leadOriginData = [
  { origem: 'Portal', leads: 45 },
  { origem: 'WhatsApp', leads: 32 },
  { origem: 'Indicação', leads: 28 },
  { origem: 'Instagram', leads: 22 },
  { origem: 'Site', leads: 18 },
]
