'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Nigerian LGAs by State - Sample comprehensive data
const NIGERIAN_LGAS: Record<string, string[]> = {
  Lagos: [
    'Agege',
    'Ajeromi-Ifelodun',
    'Alimosho',
    'Amuwo-Odofin',
    'Apapa',
    'Badagry',
    'Epe',
    'Eti Osa',
    'Ibeju-Lekki',
    'Ifako-Ijaiye',
    'Ikeja',
    'Ikorodu',
    'Kosofe',
    'Lagos Island',
    'Lagos Mainland',
    'Mushin',
    'Ojo',
    'Oshodi-Isolo',
    'Shomolu',
    'Surulere',
  ],
  Abuja: [
    'Abaji',
    'Abuja Municipal',
    'Bwari',
    'Gwagwalada',
    'Kuje',
    'Kwali',
  ],
  FCT: [
    'Abaji',
    'Abuja Municipal',
    'Bwari',
    'Gwagwalada',
    'Kuje',
    'Kwali',
  ],
  Rivers: [
    'Abua/Odual',
    'Ahoada East',
    'Ahoada West',
    'Akuku-Toru',
    'Andoni',
    'Asari-Toru',
    'Bonny',
    'Degema',
    'Eleme',
    'Emuoha',
    'Etche',
    'Gokana',
    'Ikwerre',
    'Khana',
    'Obio/Akpor',
    'Ogba/Egbema/Ndoni',
    'Ogu/Bolo',
    'Okrika',
    'Omuma',
    'Opobo/Nkoro',
    'Oyigbo',
    'Port Harcourt',
    'Tai',
  ],
  Kano: [
    'Ajingi',
    'Albasu',
    'Bagwai',
    'Bebeji',
    'Bichi',
    'Bunkure',
    'Dala',
    'Dambatta',
    'Dawakin Kudu',
    'Dawakin Tofa',
    'Doguwa',
    'Fagge',
    'Gabasawa',
    'Garko',
    'Garun Mallam',
    'Gaya',
    'Gezawa',
    'Gwale',
    'Gwarzo',
    'Kabo',
    'Kano Municipal',
    'Karaye',
    'Kibiya',
    'Kiru',
    'Kumbotso',
    'Kunchi',
    'Kura',
    'Madobi',
    'Makoda',
    'Minjibir',
    'Nasarawa',
    'Rano',
    'Rimin Gado',
    'Rogo',
    'Shanono',
    'Sumaila',
    'Takai',
    'Tarauni',
    'Tofa',
    'Tsanyawa',
    'Tudun Wada',
    'Ungogo',
    'Warawa',
    'Wudil',
  ],
  // Add more states as needed
  Ogun: [
    'Abeokuta North',
    'Abeokuta South',
    'Ado-Odo/Ota',
    'Ewekoro',
    'Ifo',
    'Ijebu East',
    'Ijebu North',
    'Ijebu North East',
    'Ijebu Ode',
    'Ikenne',
    'Imeko Afon',
    'Ipokia',
    'Obafemi Owode',
    'Odeda',
    'Odogbolu',
    'Ogun Waterside',
    'Remo North',
    'Sagamu',
    'Yewa North',
    'Yewa South',
  ],
  Oyo: [
    'Afijio',
    'Akinyele',
    'Atiba',
    'Atisbo',
    'Egbeda',
    'Ibadan North',
    'Ibadan North-East',
    'Ibadan North-West',
    'Ibadan South-East',
    'Ibadan South-West',
    'Ibarapa Central',
    'Ibarapa East',
    'Ibarapa North',
    'Ido',
    'Irepo',
    'Iseyin',
    'Itesiwaju',
    'Iwajowa',
    'Kajola',
    'Lagelu',
    'Ogbomosho North',
    'Ogbomosho South',
    'Ogo Oluwa',
    'Olorunsogo',
    'Oluyole',
    'Ona Ara',
    'Orelope',
    'Ori Ire',
    'Oyo East',
    'Oyo West',
    'Saki East',
    'Saki West',
    'Surulere',
  ],
};

interface LGASelectorProps {
  state: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function LGASelector({
  state,
  value,
  onChange,
  disabled = false,
  required = false,
}: LGASelectorProps) {
  const lgas = NIGERIAN_LGAS[state] || [];

  if (!state || lgas.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger id="lga">
          <SelectValue placeholder="Select state first" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled} required={required}>
      <SelectTrigger id="lga">
        <SelectValue placeholder="Select LGA" />
      </SelectTrigger>
      <SelectContent>
        {lgas.map((lga) => (
          <SelectItem key={lga} value={lga}>
            {lga}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}