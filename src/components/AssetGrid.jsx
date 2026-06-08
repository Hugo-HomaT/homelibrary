import AssetCard from './AssetCard'

export default function AssetGrid({ assets, favorites, selection, onToggleFav, onAdd, onOpen }) {
  if (assets.length === 0) {
    return (
      <div className="empty">
        <div className="empty-emoji">🔍</div>
        <h3>Aucun asset trouvé</h3>
        <p>Essayez un autre mot-clé, une autre catégorie ou réinitialisez les filtres.</p>
      </div>
    )
  }

  return (
    <div className="grid" key={assets.map((a) => a.id).join('-')}>
      {assets.map((asset, i) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          index={i}
          isFav={favorites.has(asset.id)}
          isSelected={selection.has(asset.id)}
          onToggleFav={onToggleFav}
          onAdd={onAdd}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
}
