import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, Clock, Lock, FileCheck } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: "Secure Verification",
      description: "Bank-grade encryption for all your documents",
    },
    {
      icon: Clock,
      title: "Fast Processing",
      description: "Get verified in minutes, not days",
    },
    {
      icon: Lock,
      title: "Privacy Protected",
      description: "Your data is encrypted and never shared",
    },
    {
      icon: FileCheck,
      title: "AI-Powered",
      description: "Advanced ML for accurate verification",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-3xl mb-6 shadow-primary">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Secure KYC Verification
            </span>
            <br />
            Made Simple
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Complete your identity verification with our AI-powered platform. Upload documents, record video, and get verified instantly.
          </p>

          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              className="text-lg px-8 shadow-primary"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Login
            </Button>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span>Trusted by 10,000+ users</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span>ISO 27001 Certified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Our Platform?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-6 shadow-card hover:shadow-primary transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-primary rounded-2xl p-12 text-center shadow-primary">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Get Verified?
          </h2>
          <p className="text-primary-foreground/90 mb-8 text-lg">
            Join thousands of users who trust our platform for secure identity verification
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8"
            onClick={() => navigate("/auth")}
          >
            Start Your KYC Application
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
