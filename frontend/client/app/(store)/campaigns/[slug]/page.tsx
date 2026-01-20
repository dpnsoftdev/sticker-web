interface CampaignPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { slug } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Campaign: {slug}</h1>
      <p>Campaign page - coming soon</p>
    </div>
  );
}
