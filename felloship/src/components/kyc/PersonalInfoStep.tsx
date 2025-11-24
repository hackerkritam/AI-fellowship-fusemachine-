import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const NEPAL_DISTRICTS = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Pokhara (Kaski)",
  "Chitwan",
  "Dhanusha",
  "Morang",
  "Jhapa",
  "Sunsari",
  "Bara",
  "Parsa",
  "Rupandehi",
  "Banke",
  "Kailali",
  "Kanchanpur",
  "Kavrepalanchok",
  "Makwanpur",
  "Tanahun",
  "Syangja",
  "Other",
];

const NEPALI_CITIES = [
  "काठमाडौं (Kathmandu)",
  "ललितपुर (Lalitpur)",
  "भक्तपुर (Bhaktapur)",
  "पोखरा (Pokhara)",
  "बिराटनगर (Biratnagar)",
  "रंगप्लूर (Rangpur)",
  "बैतडी (Baitadi)",
  "धनुसा (Dhanusha)",
  "जनकपुर (Janakpur)",
  "नेपलगञ्ज (Nepalgunj)",
  "बुटवल (Butwal)",
  "तनहुँ (Tanaun)",
  "गोरखा (Gorkha)",
  "नुवाकोट (Nuwakot)",
  "काठमाडौं उपत्यका (Kathmandu Valley)",
  "अन्य (Other)",
];

const NEPAL_MUNICIPALITIES = [
  // Kathmandu Valley
  "काठमाडौं महानगरपालिका (Kathmandu Metropolitan City)",
  "ललितपुर महानगरपालिका (Lalitpur Metropolitan City)",
  "भक्तपुर नगरपालिका (Bhaktapur Municipality)",
  "चाँगुनारायण नगरपालिका (Changunarayan Municipality)",
  "काभ्रेपलाञ्चोक नगरपालिका (Kavreplanchok Municipality)",
  "नुवाकोट नगरपालिका (Nuwakot Municipality)",
  
  // Pokhara Area
  "पोखरा महानगरपालिका (Pokhara Metropolitan City)",
  "कास्की नगरपालिका (Kaski Municipality)",
  "तनहुँ नगरपालिका (Tanahun Municipality)",
  
  // Eastern Region
  "बिराटनगर नगरपालिका (Biratnagar Municipality)",
  "मोरङ नगरपालिका (Morang Municipality)",
  "इलाम नगरपालिका (Ilam Municipality)",
  "झापा नगरपालिका (Jhapa Municipality)",
  "धनकुटा नगरपालिका (Dhankuta Municipality)",
  
  // Central Region
  "भरतपुर नगरपालिका (Bharatpur Municipality)",
  "चितवन नगरपालिका (Chitwan Municipality)",
  "गोरखा नगरपालिका (Gorkha Municipality)",
  "लमजुङ नगरपालिका (Lamjung Municipality)",
  "तनहुँ नगरपालिका (Tanahun Municipality)",
  "स्याङ्जा नगरपालिका (Syangja Municipality)",
  
  // Western Region
  "बुटवल नगरपालिका (Butwal Municipality)",
  "नेपलगञ्ज उप-महानगरपालिका (Nepalgunj Sub-Metropolitan City)",
  "धनुसा नगरपालिका (Dhanusha Municipality)",
  "जनकपुर उप-महानगरपालिका (Janakpur Sub-Metropolitan City)",
  
  // Far Western Region
  "धनकुटा नगरपालिका (Dhankuta Municipality)",
  "डडेल्धुरा नगरपालिका (Dadeldhura Municipality)",
  "बैतडी नगरपालिका (Baitadi Municipality)",
  "अन्य (Other)",
];

interface PersonalInfoStepProps {
  formData: any;
  updateFormData: (updates: any) => void;
}

const PersonalInfoStep = ({ formData, updateFormData }: PersonalInfoStepProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name (नागरिकतामा अनुसार) *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => updateFormData({ fullName: e.target.value })}
            placeholder="As per Nagarikta (Citizenship Certificate)"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth (जन्म मिति)</Label>
          <div className="text-xs text-muted-foreground mb-1">BS/Nepali Calendar</div>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
            placeholder="YYYY-MM-DD (BS)"
          />
        </div>
      </div>

      {/* Citizenship & Birthplace section */}
      <div className="mt-4 p-4 border rounded-lg bg-muted/5">
        <h3 className="text-sm font-medium mb-3">Citizenship & Birthplace</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="citizenshipNumber">Citizenship Certificate No.</Label>
            <Input
              id="citizenshipNumber"
              value={formData.citizenshipNumber || ''}
              onChange={(e) => updateFormData({ citizenshipNumber: e.target.value })}
              placeholder="e.g. 12345-67"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="citizenshipIssuedDate">Issued Date</Label>
            <Input
              id="citizenshipIssuedDate"
              type="date"
              value={formData.citizenshipIssuedDate || ''}
              onChange={(e) => updateFormData({ citizenshipIssuedDate: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
          <div className="space-y-2">
            <Label htmlFor="citizenshipIssuedDistrict">Issued District</Label>
            <Select
              value={formData.citizenshipIssuedDistrict || ''}
              onValueChange={(value) => updateFormData({ citizenshipIssuedDistrict: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select issued district" />
              </SelectTrigger>
              <SelectContent>
                {NEPAL_DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthplaceDistrict">Birthplace District</Label>
            <Select
              value={formData.birthplaceDistrict || ''}
              onValueChange={(value) => updateFormData({ birthplaceDistrict: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select birthplace district" />
              </SelectTrigger>
              <SelectContent>
                {NEPAL_DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthplaceWardNo">Ward No.</Label>
            <Input
              id="birthplaceWardNo"
              value={formData.birthplaceWardNo || ''}
              onChange={(e) => updateFormData({ birthplaceWardNo: e.target.value })}
              placeholder="Ward number"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div className="space-y-2">
            <Label htmlFor="birthplaceLocalBodyType">Local body type</Label>
            <Select
              value={formData.birthplaceLocalBodyType || ''}
              onValueChange={(value) => updateFormData({ birthplaceLocalBodyType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select local body type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rural_municipality">Rural Municipality</SelectItem>
                <SelectItem value="municipality">Municipality</SelectItem>
                <SelectItem value="sub_metropolitan">Sub-Metropolitan</SelectItem>
                <SelectItem value="metropolitan">Metropolitan</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="birthplaceLocalBodyName">Local body name (नगरपालिका)</Label>
            <Select
              value={formData.birthplaceLocalBodyName || ''}
              onValueChange={(value) => updateFormData({ birthplaceLocalBodyName: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select municipality" />
              </SelectTrigger>
              <SelectContent>
                {NEPAL_MUNICIPALITIES.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={formData.gender} onValueChange={(value) => updateFormData({ gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fatherName">Father's Name</Label>
          <Input
            id="fatherName"
            value={formData.fatherName}
            onChange={(e) => updateFormData({ fatherName: e.target.value })}
            placeholder="Father's full name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="permanentAddress">Permanent Address (स्थायी ठेगाना)</Label>
        <Input
          id="permanentAddress"
          value={formData.addressLine1}
          onChange={(e) => updateFormData({ addressLine1: e.target.value })}
          placeholder="House no., Street, Area"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="temporaryAddress">Temporary Address (अस्थायी ठेगाना)</Label>
        <Input
          id="temporaryAddress"
          value={formData.addressLine2}
          onChange={(e) => updateFormData({ addressLine2: e.target.value })}
          placeholder="House no., Street, Area"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City (शहर)</Label>
          <Select value={formData.city} onValueChange={(value) => updateFormData({ city: value })}>
            <SelectTrigger>
              <SelectValue placeholder="नगर छनोट गर्नुहोस्" />
            </SelectTrigger>
            <SelectContent>
              {NEPALI_CITIES.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">Province (प्रदेश)</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => updateFormData({ state: e.target.value })}
            placeholder="प्रदेश"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pincode">Postal Code</Label>
          <Input
            id="pincode"
            value={formData.pincode}
            onChange={(e) => updateFormData({ pincode: e.target.value })}
            placeholder="Postal code"
            maxLength={6}
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoStep;
