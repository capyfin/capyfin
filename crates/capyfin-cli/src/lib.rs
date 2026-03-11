use std::fmt::Write as _;

use capyfin_core::{AppCore, AppMetadata};
use clap::{Parser, Subcommand, ValueEnum};

#[derive(Debug, Parser)]
#[command(name = "capyfin", about = "CapyFin operational CLI")]
pub struct Cli {
    #[arg(long, global = true, value_enum, default_value_t = OutputFormat::Text)]
    output: OutputFormat,
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Debug, Copy, Clone, ValueEnum, PartialEq, Eq)]
pub enum OutputFormat {
    Text,
    Json,
}

#[derive(Debug, Subcommand)]
pub enum Command {
    Metadata,
    Workspace,
}

pub fn run(cli: Cli) -> Result<String, serde_json::Error> {
    let core = AppCore::default();
    let metadata = core.app_metadata();

    match cli.output {
        OutputFormat::Json => serde_json::to_string_pretty(&metadata),
        OutputFormat::Text => Ok(match cli.command.unwrap_or(Command::Metadata) {
            Command::Metadata => render_metadata_text(&metadata),
            Command::Workspace => render_workspace_text(&metadata),
        }),
    }
}

pub fn parse() -> Cli {
    Cli::parse()
}

fn render_metadata_text(metadata: &AppMetadata) -> String {
    let mut output = String::new();

    writeln!(&mut output, "Product: {}", metadata.product_name)
        .expect("writing to a String cannot fail");
    writeln!(&mut output, "Workspace areas:").expect("writing to a String cannot fail");

    for area in &metadata.workspace_layout {
        writeln!(&mut output, "- {}: {}", area.path, area.responsibility)
            .expect("writing to a String cannot fail");
    }

    output
}

fn render_workspace_text(metadata: &AppMetadata) -> String {
    let mut output = String::new();

    for area in &metadata.workspace_layout {
        writeln!(&mut output, "{}\t{}", area.path, area.responsibility)
            .expect("writing to a String cannot fail");
    }

    output
}

#[cfg(test)]
mod tests {
    use capyfin_core::AppCore;

    use super::{render_metadata_text, render_workspace_text};

    #[test]
    fn metadata_renderer_contains_product_name() {
        let metadata = AppCore::default().app_metadata();
        let rendered = render_metadata_text(&metadata);

        assert!(rendered.contains("Product: CapyFin"));
        assert!(rendered.contains("crates/capyfin-core"));
    }

    #[test]
    fn workspace_renderer_outputs_tabular_lines() {
        let metadata = AppCore::default().app_metadata();
        let rendered = render_workspace_text(&metadata);

        assert!(rendered.contains("apps/desktop\t"));
        assert!(rendered.contains("crates/capyfin-cli\t"));
    }
}
