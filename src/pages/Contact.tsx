import { Mail, MapPin, Phone } from 'lucide-react';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Contact() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container max-w-3xl flex-1 py-12">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Contact Us</h1>
          <p className="mt-1 text-muted-foreground">We would love to hear from you. Reach out using the details below.</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Address</CardTitle>
                <CardDescription>Visit our office</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground">
                Plot no 200, Sector 7/A
                <br />
                Korangi Industrial Area, Karachi West
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Email</CardTitle>
                <CardDescription>Send us a message anytime</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <a
                href="mailto:contact@sndymarket.com"
                className="
                  text-sm text-primary
                  hover:underline
                "
              >
                contact@sndymarket.com
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Phone</CardTitle>
                <CardDescription>Mon – Fri, 9am – 6pm EST</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <a
                href="tel:0309-2257637"
                className="
                  text-sm text-primary
                  hover:underline
                "
              >
                0309 2257637
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
