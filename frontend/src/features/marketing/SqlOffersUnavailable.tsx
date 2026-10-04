const SqlOffersUnavailable = () => (
  <main className="min-h-full bg-app p-8 text-main">
    <section className="mx-auto max-w-2xl rounded-xl border border-warning/30 bg-surface p-8">
      <h1 className="text-2xl font-bold">Offers and campaign actions are unavailable</h1>
      <p className="mt-3 text-secondary">
        Existing SQL rows do not provide a verified scheme eligibility, redemption, invoice-link, and reversal lifecycle. No promotion or campaign data was saved.
      </p>
      <p className="mt-2 text-secondary">
        WhatsApp/SMS, social, email and storefront connections have no verified SQL campaign log in this app. Provider connectivity alone does not record campaign delivery or sales attribution.
      </p>
    </section>
  </main>
);

export default SqlOffersUnavailable;
