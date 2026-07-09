import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Mail, Phone } from "lucide-react";

const Contact = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className="flex-1 container py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">Contact Us</h1>
        <p className="text-muted-foreground mt-1">We would love to hear from you. Reach out using the details below.</p>
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
            <p className="text-sm text-foreground">Plot no 200, Sector 7/A<br />Korangi Industrial Area, Karachi West</p>
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
            <a href="mailto:areebaghouriii@gmail.com" className="text-sm text-primary hover:underline">areebaghouriii@gmail.com</a>
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
            <a href="tel:0336-8914667" className="text-sm text-primary hover:underline">0336 8914667</a>
          </CardContent>
        </Card>
      </div>
    </main>
    <Footer />
  </div>
);

export default Contact;
