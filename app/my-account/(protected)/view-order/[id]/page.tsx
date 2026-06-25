interface Props {
  params: { id: string };
}

export default function ViewOrderPage({ params }: Props) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Order #{params.id}
      </h2>

      <p>Order details will load here.</p>
    </div>
  );
}
